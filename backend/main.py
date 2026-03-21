from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import secrets
import string
import models
from models import get_db, AuditLog, User
from agent import interroger_agent
from auth import (
    hash_password, verify_password, create_token,
    get_current_user, require_role, ACCESS_TOKEN_EXPIRE_MINUTES
)
from email_service import send_welcome_agent, send_org_request_notification, send_org_approved, send_reset_password_email
from datetime import datetime, timedelta
import secrets as secrets_module
import os
models.init_db()

app = FastAPI(title="Salama Data API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_password(length=12):
    chars = string.ascii_letters + string.digits + "!@#$"
    return ''.join(secrets.choice(chars) for _ in range(length))

def log_action(db: Session, action: str, details: str = None, user=None, request: Request = None):
    entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        user_role=user.role if user else None,
        action=action,
        details=details,
        ip_address=request.client.host if request else None,
        organisation_id=user.organisation_id if user else 1
    )
    db.add(entry)
    db.commit()

def create_default_admin(db: Session):
    existing = db.query(User).filter(User.email == "admin@salama-data.org").first()
    if not existing:
        admin = User(
            nom="Admin", prenom="Salama",
            email="admin@salama-data.org",
            hashed_password=hash_password("Salama2026!"),
            role="admin", organisation_id=1, is_active=True
        )
        db.add(admin)
        db.commit()

db_init = next(get_db())
create_default_admin(db_init)

# ── Schemas ───────────────────────────────────────────────────────────────────
class BeneficiaireCreate(BaseModel):
    nom: str
    prenom: str
    age: Optional[int] = None
    sexe: Optional[str] = None
    telephone: Optional[str] = None
    numero_cni: Optional[str] = None
    photo_cni: Optional[str] = None
    nom_referent: Optional[str] = None
    telephone_referent: Optional[str] = None
    zone_origine: Optional[str] = None
    site_deplacement: Optional[str] = None
    nb_dependants: int = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    groupe_vulnerable: Optional[str] = None
    besoin_eau: bool = False
    besoin_alimentation: bool = False
    besoin_abri: bool = False
    besoin_sante: bool = False
    besoin_education: bool = False
    agent_id: Optional[str] = None
    notes: Optional[str] = None

@app.delete("/beneficiaires/{beneficiaire_id}")
def supprimer_beneficiaire(
    beneficiaire_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    b = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.id == beneficiaire_id,
        models.Beneficiaire.organisation_id == current_user.organisation_id
    ).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
    db.delete(b)
    db.commit()
    log_action(db, "BENEFICIAIRE_DELETED",
               f"Bénéficiaire {b.prenom} {b.nom} supprimé",
               user=current_user, request=request)
    return {"message": "Bénéficiaire supprimé"}

class AgentQuestion(BaseModel):
    question: str

class UserCreate(BaseModel):
    nom: str
    prenom: str
    email: str
    password: str
    role: str = "agent"

class UserUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class OrgRequestCreate(BaseModel):
    org_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    type_org: str = "ONG"
    message: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
# ── Auth Routes ────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Salama Data API v2.0", "status": "online"}

@app.post("/auth/login")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        log_action(db, "LOGIN_FAILED", f"Tentative échouée pour {form_data.username}", request=request)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    user.derniere_connexion = datetime.utcnow()
    db.commit()

    token = create_token(
        {"sub": user.email, "role": user.role, "org": user.organisation_id},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    log_action(db, "LOGIN_SUCCESS", "Connexion réussie", user=user, request=request)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nom": user.nom,
            "prenom": user.prenom,
            "email": user.email,
            "role": user.role
        }
    }

class PersonnelCreate(BaseModel):
    nom: str
    prenom: str
    specialite: str
    telephone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    zone: Optional[str] = None
    disponibilite: bool = True
    statut: str = "actif"

class PersonnelUpdate(BaseModel):
    disponibilite: Optional[bool] = None
    statut: Optional[str] = None
    zone: Optional[str] = None
@app.get("/personnel/stats")
def stats_personnel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organisation_id
    total = db.query(models.PersonnelSante).filter(
        models.PersonnelSante.organisation_id == org_id
    ).count()
    disponibles = db.query(models.PersonnelSante).filter(
        models.PersonnelSante.organisation_id == org_id,
        models.PersonnelSante.disponibilite == True
    ).count()
    specialites = db.query(
        models.PersonnelSante.specialite,
        func.count(models.PersonnelSante.id)
    ).filter(
        models.PersonnelSante.organisation_id == org_id
    ).group_by(models.PersonnelSante.specialite).all()
    return {
        "total": total,
        "disponibles": disponibles,
        "indisponibles": total - disponibles,
        "par_specialite": {s: c for s, c in specialites}
    }

@app.get("/personnel")
def lister_personnel(
    disponible: Optional[bool] = None,
    specialite: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(models.PersonnelSante).filter(
        models.PersonnelSante.organisation_id == current_user.organisation_id
    )
    if disponible is not None:
        query = query.filter(models.PersonnelSante.disponibilite == disponible)
    if specialite:
        query = query.filter(models.PersonnelSante.specialite == specialite)
    return query.all()

@app.post("/personnel")
def ajouter_personnel(
    data: PersonnelCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    p = models.PersonnelSante(
        **data.model_dump(),
        organisation_id=current_user.organisation_id
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    log_action(db, "PERSONNEL_ADDED",
               f"Personnel {data.prenom} {data.nom} ({data.specialite}) ajouté",
               user=current_user, request=request)
    return {"id": p.id, "message": f"{data.prenom} {data.nom} ajouté avec succès"}

@app.put("/personnel/{personnel_id}")
def modifier_personnel(
    personnel_id: int,
    data: PersonnelUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    p = db.query(models.PersonnelSante).filter(
        models.PersonnelSante.id == personnel_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Personnel non trouvé")
    if data.disponibilite is not None: p.disponibilite = data.disponibilite
    if data.statut: p.statut = data.statut
    if data.zone: p.zone = data.zone
    db.commit()
    log_action(db, "PERSONNEL_UPDATED", f"Personnel {p.prenom} {p.nom} modifié", user=current_user, request=request)
    return {"message": "Personnel mis à jour"}

@app.delete("/personnel/{personnel_id}")
def supprimer_personnel(
    personnel_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    p = db.query(models.PersonnelSante).filter(
        models.PersonnelSante.id == personnel_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Personnel non trouvé")
    db.delete(p)
    db.commit()
    log_action(db, "PERSONNEL_DELETED", f"Personnel {p.prenom} {p.nom} supprimé", user=current_user, request=request)
    return {"message": "Personnel supprimé"}


@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "nom": current_user.nom,
        "prenom": current_user.prenom,
        "email": current_user.email,
        "role": current_user.role,
        "derniere_connexion": current_user.derniere_connexion
    }

# ── Public Routes ──────────────────────────────────────────────────────────────
@app.post("/public/org-request")
def submit_org_request(data: OrgRequestCreate, db: Session = Depends(get_db)):
    existing = db.query(models.OrgRequest).filter(
        models.OrgRequest.email == data.email,
        models.OrgRequest.status == "pending"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Une demande est déjà en cours pour cet email")

    req = models.OrgRequest(**data.model_dump())
    db.add(req)
    db.commit()

    send_org_request_notification(
        org_name=data.org_name,
        contact_name=data.contact_name,
        email=data.email,
        phone=data.phone or "Non fourni",
        message=data.message or "Aucun message"
    )
    return {"message": "Demande envoyée avec succès. Vous recevrez une réponse sous 48h."}

# ── User Management ────────────────────────────────────────────────────────────
@app.get("/users")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    users = db.query(User).filter(User.organisation_id == current_user.organisation_id).all()
    return [{"id": u.id, "nom": u.nom, "prenom": u.prenom, "email": u.email,
             "role": u.role, "is_active": u.is_active,
             "derniere_connexion": u.derniere_connexion} for u in users]

@app.post("/users")
def create_user(data: UserCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager"))):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    if data.role not in ["admin", "manager", "agent"]:
        raise HTTPException(status_code=400, detail="Rôle invalide")

    user = User(
        nom=data.nom, prenom=data.prenom, email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role, organisation_id=current_user.organisation_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    org = db.query(models.Organisation).filter(
        models.Organisation.id == current_user.organisation_id
    ).first()
    org_name = org.nom if org else "Salama Data"

    send_welcome_agent(
        to_email=data.email, prenom=data.prenom, nom=data.nom,
        role=data.role, password=data.password, org_name=org_name
    )

    log_action(db, "USER_CREATED", f"Nouvel utilisateur: {data.email} ({data.role})", user=current_user, request=request)
    return {"id": user.id, "message": f"Utilisateur {data.prenom} {data.nom} créé et email envoyé"}

@app.put("/users/{user_id}")
def update_user(user_id: int, data: UserUpdate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if data.nom: user.nom = data.nom
    if data.prenom: user.prenom = data.prenom
    if data.role: user.role = data.role
    if data.is_active is not None: user.is_active = data.is_active
    db.commit()
    log_action(db, "USER_UPDATED", f"Utilisateur {user.email} modifié", user=current_user, request=request)
    return {"message": "Utilisateur mis à jour"}

@app.delete("/users/{user_id}")
def delete_user(user_id: int, request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de supprimer votre propre compte")
    db.delete(user)
    db.commit()
    log_action(db, "USER_DELETED", f"Utilisateur {user.email} supprimé", user=current_user, request=request)
    return {"message": "Utilisateur supprimé"}

# ── Org Requests ───────────────────────────────────────────────────────────────
@app.get("/org-requests")
def list_org_requests(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return db.query(models.OrgRequest).order_by(models.OrgRequest.date_demande.desc()).all()

@app.post("/org-requests/{request_id}/approve")
def approve_org_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    org_request = db.query(models.OrgRequest).filter(
        models.OrgRequest.id == request_id
    ).first()
    if not org_request:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    if org_request.status == "approved":
        raise HTTPException(status_code=400, detail="Demande déjà approuvée")
    
    # 1 — Créer l'organisation
    nouvelle_org = models.Organisation(
        nom=org_request.org_name,
        type_org=org_request.type_org,
        email=org_request.email,
        telephone=org_request.phone,
        ville="",
        pays="RDC",
        is_active=True
    )
    db.add(nouvelle_org)
    db.flush()  # Pour obtenir l'id avant commit

    # 2 — Générer mot de passe
    import secrets as sec
    password = sec.token_urlsafe(10)

    # 3 — Créer compte admin de l'organisation
    admin_user = User(
        nom=org_request.contact_name.split()[-1] if ' ' in org_request.contact_name else org_request.contact_name,
        prenom=org_request.contact_name.split()[0] if ' ' in org_request.contact_name else org_request.contact_name,
        email=org_request.email,
        hashed_password=hash_password(password),
        role="manager",
        organisation_id=nouvelle_org.id,
        is_active=True
    )
    db.add(admin_user)

    # 4 — Mettre à jour le statut de la demande
    org_request.status = "approved"
    org_request.date_traitement = datetime.utcnow()
    db.commit()

    # 5 — Envoyer email
    send_org_approved(
        to_email=org_request.email,
        org_name=org_request.org_name,
        contact_name=org_request.contact_name,
        admin_password=password
    )

    log_action(db, "ORG_APPROVED",
               f"Organisation {org_request.org_name} approuvée — compte créé",
               user=current_user, request=request)

    return {
        "message": f"Organisation {org_request.org_name} approuvée",
        "organisation_id": nouvelle_org.id,
        "email": org_request.email
    }

@app.post("/org-requests/{request_id}/approve")
def approve_org_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    org_request = db.query(models.OrgRequest).filter(
        models.OrgRequest.id == request_id
    ).first()
    if not org_request:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    if org_request.status == "approved":
        raise HTTPException(status_code=400, detail="Demande déjà approuvée")

    # 1 — Créer l'organisation
    nouvelle_org = models.Organisation(
        nom=org_request.org_name,
        type_org=org_request.type_org,
        email=org_request.email,
        telephone=org_request.phone,
        ville="",
        pays="RDC",
        is_active=True
    )
    db.add(nouvelle_org)
    db.flush()

    # 2 — Vérifier si l'email existe déjà
    existing_user = db.query(User).filter(User.email == org_request.email).first()
    if existing_user:
        # Mettre à jour l'organisation_id de l'utilisateur existant
        existing_user.organisation_id = nouvelle_org.id
        existing_user.role = "manager"
        org_request.status = "approved"
        org_request.date_traitement = datetime.utcnow()
        db.commit()
        return {
            "message": f"Organisation {org_request.org_name} approuvée — compte existant mis à jour",
            "organisation_id": nouvelle_org.id,
            "email": org_request.email
        }

    # 3 — Générer mot de passe
    import secrets as sec
    password = sec.token_urlsafe(10)

    # 4 — Créer nouveau compte
    parts = org_request.contact_name.split()
    prenom = parts[0] if parts else org_request.contact_name
    nom = parts[-1] if len(parts) > 1 else org_request.contact_name

    admin_user = User(
        nom=nom,
        prenom=prenom,
        email=org_request.email,
        hashed_password=hash_password(password),
        role="manager",
        organisation_id=nouvelle_org.id,
        is_active=True
    )
    db.add(admin_user)
    org_request.status = "approved"
    org_request.date_traitement = datetime.utcnow()
    db.commit()

    # 5 — Envoyer email
    send_org_approved(
        to_email=org_request.email,
        org_name=org_request.org_name,
        contact_name=org_request.contact_name,
        admin_password=password
    )

    log_action(db, "ORG_APPROVED",
               f"Organisation {org_request.org_name} approuvée",
               user=current_user, request=request)

    return {
        "message": f"Organisation {org_request.org_name} approuvée",
        "organisation_id": nouvelle_org.id,
        "email": org_request.email
    }


@app.post("/org-requests/{request_id}/reject")
def reject_org_request(request_id: int, request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    req = db.query(models.OrgRequest).filter(models.OrgRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    req.status = "rejected"
    req.date_traitement = datetime.utcnow()
    db.commit()
    log_action(db, "ORG_REJECTED", f"Organisation {req.org_name} rejetée", user=current_user, request=request)
    return {"message": "Demande rejetée"}

# ── Audit Log ──────────────────────────────────────────────────────────────────
@app.get("/audit")
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager"))):
    logs = db.query(AuditLog).filter(
        AuditLog.organisation_id == current_user.organisation_id
    ).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return logs

# ── Data Routes ────────────────────────────────────────────────────────────────
@app.post("/beneficiaires")
def creer_beneficiaire(data: BeneficiaireCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = models.Beneficiaire(**data.model_dump(), organisation_id=current_user.organisation_id)
    db.add(b)
    db.commit()
    db.refresh(b)
    log_action(db, "BENEFICIAIRE_CREATED", f"Bénéficiaire {data.prenom} {data.nom} enregistré", user=current_user, request=request)
    return {"id": b.id, "message": "Bénéficiaire enregistré avec succès"}

@app.get("/beneficiaires")
def lister_beneficiaires(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager"))):
    return db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == current_user.organisation_id
    ).all()

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org_id = current_user.organisation_id
    total = db.query(models.Beneficiaire).filter(models.Beneficiaire.organisation_id == org_id).count()
    zones = db.query(models.Beneficiaire.zone_origine).filter(models.Beneficiaire.organisation_id == org_id).distinct().all()
    agents = db.query(models.Beneficiaire.agent_id).filter(models.Beneficiaire.organisation_id == org_id).distinct().count()
    return {
        "total_beneficiaires": total,
        "zones": [z[0] for z in zones if z[0]],
        "nb_agents": agents,
        "collectes_mois": 0,
        "user_role": current_user.role
    }

@app.post("/agent")
def poser_question(body: AgentQuestion, request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager"))):
    org_id = current_user.organisation_id
    total = db.query(models.Beneficiaire).filter(models.Beneficiaire.organisation_id == org_id).count()
    zones = db.query(models.Beneficiaire.zone_origine).filter(models.Beneficiaire.organisation_id == org_id).distinct().all()
    agents = db.query(models.Beneficiaire.agent_id).filter(models.Beneficiaire.organisation_id == org_id).distinct().count()
    contexte = {"total_beneficiaires": total, "zones": [z[0] for z in zones if z[0]], "nb_agents": agents, "collectes_mois": 0}
    reponse = interroger_agent(body.question, contexte)
    log_action(db, "AGENT_QUERY", f"Question: {body.question[:100]}", user=current_user, request=request)
    return {"reponse": reponse}

@app.get("/beneficiaires/{beneficiaire_id}")
def get_beneficiaire(
    beneficiaire_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.id == beneficiaire_id,
        models.Beneficiaire.organisation_id == current_user.organisation_id
    ).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
    return b

@app.put("/beneficiaires/{beneficiaire_id}/verify")
def verify_beneficiaire(
    beneficiaire_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    b = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.id == beneficiaire_id
    ).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
    b.verifie = not b.verifie
    db.commit()
    log_action(db, "BENEFICIAIRE_VERIFIED",
               f"Bénéficiaire {b.prenom} {b.nom} {'vérifié' if b.verifie else 'non vérifié'}",
               user=current_user, request=request)
    return {"verifie": b.verifie}

@app.put("/beneficiaires/{beneficiaire_id}/aide")
def update_aide(
    beneficiaire_id: int,
    request: Request,
    aide_alimentaire: Optional[bool] = None,
    aide_abri: Optional[bool] = None,
    aide_medicale: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    b = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.id == beneficiaire_id
    ).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
    if aide_alimentaire is not None: b.aide_alimentaire = aide_alimentaire
    if aide_abri is not None: b.aide_abri = aide_abri
    if aide_medicale is not None: b.aide_medicale = aide_medicale
    db.commit()
    log_action(db, "AIDE_UPDATED", f"Aide mise à jour pour {b.prenom} {b.nom}", user=current_user, request=request)
    return {"message": "Aide mise à jour"}

class AffectationCreate(BaseModel):
    personnel_id: int
    zone: str
    notes: Optional[str] = None

@app.get("/affectations")
def lister_affectations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    affectations = db.query(models.Affectation).filter(
        models.Affectation.organisation_id == current_user.organisation_id,
        models.Affectation.statut == "active"
    ).all()

    result = []
    for a in affectations:
        p = db.query(models.PersonnelSante).filter(
            models.PersonnelSante.id == a.personnel_id
        ).first()
        if p:
            result.append({
                "id": a.id,
                "zone": a.zone,
                "date_debut": a.date_debut,
                "notes": a.notes,
                "personnel": {
                    "id": p.id,
                    "nom": p.nom,
                    "prenom": p.prenom,
                    "specialite": p.specialite,
                    "telephone": p.telephone,
                    "disponibilite": p.disponibilite
                }
            })
    return result

@app.post("/affectations")
def creer_affectation(
    data: AffectationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    p = db.query(models.PersonnelSante).filter(
        models.PersonnelSante.id == data.personnel_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Personnel non trouvé")

    existing = db.query(models.Affectation).filter(
        models.Affectation.personnel_id == data.personnel_id,
        models.Affectation.statut == "active"
    ).first()
    if existing:
        existing.statut = "terminee"
        existing.date_fin = datetime.utcnow()

    a = models.Affectation(
        personnel_id=data.personnel_id,
        zone=data.zone,
        notes=data.notes,
        organisation_id=current_user.organisation_id,
        created_by=current_user.id
    )
    db.add(a)
    p.zone = data.zone
    p.disponibilite = False
    db.commit()
    db.refresh(a)

    log_action(db, "AFFECTATION_CREATED",
               f"{p.prenom} {p.nom} affecté à {data.zone}",
               user=current_user, request=request)
    return {"id": a.id, "message": f"{p.prenom} {p.nom} affecté à {data.zone}"}

@app.delete("/affectations/{affectation_id}")
def terminer_affectation(
    affectation_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    a = db.query(models.Affectation).filter(
        models.Affectation.id == affectation_id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Affectation non trouvée")

    a.statut = "terminee"
    a.date_fin = datetime.utcnow()

    p = db.query(models.PersonnelSante).filter(
        models.PersonnelSante.id == a.personnel_id
    ).first()
    if p:
        p.disponibilite = True
        p.zone = None

    db.commit()
    log_action(db, "AFFECTATION_ENDED",
               f"Affectation terminée pour zone {a.zone}",
               user=current_user, request=request)
    return {"message": "Affectation terminée"}

@app.get("/affectations/par-zone")
def affectations_par_zone(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    affectations = db.query(models.Affectation).filter(
        models.Affectation.organisation_id == current_user.organisation_id,
        models.Affectation.statut == "active"
    ).all()

    zones = {}
    for a in affectations:
        p = db.query(models.PersonnelSante).filter(
            models.PersonnelSante.id == a.personnel_id
        ).first()
        if p:
            if a.zone not in zones:
                zones[a.zone] = []
            zones[a.zone].append({
                "affectation_id": a.id,
                "personnel_id": p.id,
                "nom": f"{p.prenom} {p.nom}",
                "specialite": p.specialite,
                "telephone": p.telephone or "—"
            })
    return zones

class ZoneCreate(BaseModel):
    nom: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    nb_deplaces: int = 0
    description: Optional[str] = None

@app.get("/zones")
def lister_zones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zones = db.query(models.Zone).filter(
        models.Zone.organisation_id == current_user.organisation_id
    ).all()

    result = []
    for z in zones:
        personnel_count = db.query(models.PersonnelSante).filter(
            models.PersonnelSante.zone == z.nom,
            models.PersonnelSante.organisation_id == current_user.organisation_id,
            models.PersonnelSante.disponibilite == False
        ).count()

        if personnel_count == 0:
            ratio = z.nb_deplaces
        else:
            ratio = z.nb_deplaces / personnel_count

        if ratio == 0:
            criticite = "stable"
        elif ratio < 500:
            criticite = "stable"
        elif ratio < 1000:
            criticite = "tension"
        else:
            criticite = "critique"

        result.append({
            "id": z.id,
            "nom": z.nom,
            "latitude": z.latitude,
            "longitude": z.longitude,
            "nb_deplaces": z.nb_deplaces,
            "nb_personnel": personnel_count,
            "ratio": round(ratio, 1),
            "criticite": criticite,
            "description": z.description
        })

    return sorted(result, key=lambda x: ["critique","tension","stable"].index(x["criticite"]))

@app.post("/zones")
def creer_zone(
    data: ZoneCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    z = models.Zone(
        **data.model_dump(),
        organisation_id=current_user.organisation_id
    )
    db.add(z)
    db.commit()
    db.refresh(z)
    log_action(db, "ZONE_CREATED", f"Zone {data.nom} créée", user=current_user, request=request)
    return {"id": z.id, "message": f"Zone {data.nom} créée avec succès"}

@app.put("/zones/{zone_id}")
def modifier_zone(
    zone_id: int,
    data: ZoneCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    z = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
    if not z:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    z.nom = data.nom
    z.nb_deplaces = data.nb_deplaces
    z.latitude = data.latitude
    z.longitude = data.longitude
    z.description = data.description
    db.commit()
    log_action(db, "ZONE_UPDATED", f"Zone {z.nom} mise à jour", user=current_user, request=request)
    return {"message": "Zone mise à jour"}

@app.delete("/zones/{zone_id}")
def supprimer_zone(
    zone_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    z = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
    if not z:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    db.delete(z)
    db.commit()
    log_action(db, "ZONE_DELETED", f"Zone {z.nom} supprimée", user=current_user, request=request)
    return {"message": "Zone supprimée"}

@app.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(models.Notification).filter(
        models.Notification.organisation_id == current_user.organisation_id
    ).order_by(models.Notification.date_creation.desc()).limit(20).all()

@app.post("/notifications/generer")
def generer_notifications(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    org_id = current_user.organisation_id
    notifications = []

    # Analyse doublons
    doublons = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id,
        models.Beneficiaire.doublon_detecte == True
    ).count()
    if doublons > 0:
        notifications.append(models.Notification(
            type="doublon",
            titre=f"⚠️ {doublons} doublon(s) détecté(s)",
            message=f"{doublons} bénéficiaires ont été identifiés comme doublons potentiels. Vérifiez et nettoyez la base pour éviter la distribution multiple.",
            niveau="warning",
            organisation_id=org_id
        ))

    # Analyse besoins santé non couverts
    besoin_sante = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id,
        models.Beneficiaire.besoin_sante == True,
        models.Beneficiaire.aide_medicale == False
    ).count()
    if besoin_sante > 0:
        personnel_dispo = db.query(models.PersonnelSante).filter(
            models.PersonnelSante.organisation_id == org_id,
            models.PersonnelSante.disponibilite == True
        ).count()
        niveau = "critique" if besoin_sante > 100 else "warning"
        notifications.append(models.Notification(
            type="sante",
            titre=f"🏥 {besoin_sante} bénéficiaire(s) nécessitent des soins",
            message=f"{besoin_sante} personnes ont un besoin médical non couvert. Personnel disponible : {personnel_dispo} agent(s). {'Action urgente requise.' if niveau == 'critique' else 'Planifiez une intervention.'}",
            niveau=niveau,
            organisation_id=org_id
        ))

    # Analyse besoins eau
    besoin_eau = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id,
        models.Beneficiaire.besoin_eau == True
    ).count()
    if besoin_eau > 0:
        notifications.append(models.Notification(
            type="eau",
            titre=f"💧 {besoin_eau} personne(s) sans accès à l'eau",
            message=f"{besoin_eau} bénéficiaires ont signalé un manque d'accès à l'eau potable et à l'assainissement. Intervention WASH prioritaire recommandée.",
            niveau="warning",
            organisation_id=org_id
        ))

    # Analyse besoins alimentation
    besoin_alim = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id,
        models.Beneficiaire.besoin_alimentation == True,
        models.Beneficiaire.aide_alimentaire == False
    ).count()
    if besoin_alim > 0:
        notifications.append(models.Notification(
            type="alimentation",
            titre=f"🌾 {besoin_alim} personne(s) en insécurité alimentaire",
            message=f"{besoin_alim} bénéficiaires n'ont pas encore reçu d'aide alimentaire malgré un besoin identifié. Distribution prioritaire recommandée.",
            niveau="warning",
            organisation_id=org_id
        ))

    # Analyse zones critiques
    zones = db.query(models.Zone).filter(
        models.Zone.organisation_id == org_id
    ).all()
    for z in zones:
        personnel_zone = db.query(models.PersonnelSante).filter(
            models.PersonnelSante.zone == z.nom,
            models.PersonnelSante.organisation_id == org_id
        ).count()
        if z.nb_deplaces > 0 and personnel_zone == 0:
            notifications.append(models.Notification(
                type="zone_critique",
                titre=f"🚨 Zone {z.nom} sans personnel",
                message=f"La zone {z.nom} compte {z.nb_deplaces} déplacés mais aucun personnel de santé affecté. Affectation urgente recommandée.",
                niveau="critique",
                organisation_id=org_id
            ))

    # Analyse vulnérables sans aide
    vulnerables = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id,
        models.Beneficiaire.groupe_vulnerable != "Aucun",
        models.Beneficiaire.groupe_vulnerable != None,
        models.Beneficiaire.verifie == False
    ).count()
    if vulnerables > 0:
        notifications.append(models.Notification(
            type="vulnerable",
            titre=f"👶 {vulnerables} personne(s) vulnérable(s) non vérifiée(s)",
            message=f"{vulnerables} bénéficiaires appartenant à des groupes vulnérables (enfants, femmes enceintes, handicapés) n'ont pas encore été vérifiés. Priorisation recommandée.",
            niveau="warning",
            organisation_id=org_id
        ))

    # Analyse non vérifiés
    non_verifies = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id,
        models.Beneficiaire.verifie == False
    ).count()
    total = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id
    ).count()
    if total > 0 and non_verifies > total * 0.5:
        notifications.append(models.Notification(
            type="verification",
            titre=f"📋 {non_verifies}/{total} bénéficiaires non vérifiés",
            message=f"Plus de 50% des bénéficiaires enregistrés n'ont pas encore été vérifiés. La vérification d'identité réduit les risques de fraude et de distribution multiple.",
            niveau="info",
            organisation_id=org_id
        ))

    # Sauvegarder
    for n in notifications:
        db.add(n)
    db.commit()

    log_action(db, "NOTIFICATIONS_GENERATED",
               f"{len(notifications)} notification(s) générée(s)",
               user=current_user, request=request)
    return {"generated": len(notifications), "notifications": [{"titre": n.titre, "niveau": n.niveau} for n in notifications]}

@app.put("/notifications/{notif_id}/lire")
def marquer_lu(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    n = db.query(models.Notification).filter(
        models.Notification.id == notif_id
    ).first()
    if n:
        n.lu = True
        db.commit()
    return {"message": "Notification lue"}

@app.delete("/notifications/effacer")
def effacer_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    db.query(models.Notification).filter(
        models.Notification.organisation_id == current_user.organisation_id
    ).delete()
    db.commit()
    return {"message": "Notifications effacées"}

class RessourcesUpdate(BaseModel):
    personnel_medical: Optional[float] = None
    eau_potable: Optional[float] = None
    nourriture: Optional[float] = None
    abris: Optional[float] = None
    ecoles: Optional[float] = None

@app.get("/ressources")
def get_ressources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organisation_id
    total = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id
    ).count()

    # Calcul automatique
    if total > 0:
        sans_eau = db.query(models.Beneficiaire).filter(
            models.Beneficiaire.organisation_id == org_id,
            models.Beneficiaire.besoin_eau == False
        ).count()
        sans_alim = db.query(models.Beneficiaire).filter(
            models.Beneficiaire.organisation_id == org_id,
            models.Beneficiaire.besoin_alimentation == False
        ).count()
        sans_abri = db.query(models.Beneficiaire).filter(
            models.Beneficiaire.organisation_id == org_id,
            models.Beneficiaire.besoin_abri == False
        ).count()
        sans_educ = db.query(models.Beneficiaire).filter(
            models.Beneficiaire.organisation_id == org_id,
            models.Beneficiaire.besoin_education == False
        ).count()
        nb_personnel = db.query(models.PersonnelSante).filter(
            models.PersonnelSante.organisation_id == org_id,
            models.PersonnelSante.disponibilite == True
        ).count()
        auto = {
            "personnel_medical": min(round((nb_personnel / max(total / 100, 1)) * 10, 1), 100),
            "eau_potable":       round((sans_eau / total) * 100, 1),
            "nourriture":        round((sans_alim / total) * 100, 1),
            "abris":             round((sans_abri / total) * 100, 1),
            "ecoles":            round((sans_educ / total) * 100, 1),
        }
    else:
        auto = {
            "personnel_medical": 0,
            "eau_potable": 0,
            "nourriture": 0,
            "abris": 0,
            "ecoles": 0,
        }

    # Corrections manuelles
    manuel = db.query(models.RessourcesLocales).filter(
        models.RessourcesLocales.organisation_id == org_id
    ).first()

    result = {}
    for key in auto:
        manuel_val = getattr(manuel, key, None) if manuel else None
        result[key] = {
            "auto": auto[key],
            "manuel": manuel_val,
            "valeur": manuel_val if manuel_val is not None else auto[key]
        }

    return result

@app.put("/ressources")
def update_ressources(
    data: RessourcesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    org_id = current_user.organisation_id
    ressource = db.query(models.RessourcesLocales).filter(
        models.RessourcesLocales.organisation_id == org_id
    ).first()

    if not ressource:
        ressource = models.RessourcesLocales(organisation_id=org_id)
        db.add(ressource)

    if data.personnel_medical is not None: ressource.personnel_medical = data.personnel_medical
    if data.eau_potable is not None: ressource.eau_potable = data.eau_potable
    if data.nourriture is not None: ressource.nourriture = data.nourriture
    if data.abris is not None: ressource.abris = data.abris
    if data.ecoles is not None: ressource.ecoles = data.ecoles
    ressource.date_mise_a_jour = datetime.utcnow()
    db.commit()
    return {"message": "Ressources mises à jour"}

@app.delete("/ressources/reset")
def reset_ressources(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    db.query(models.RessourcesLocales).filter(
        models.RessourcesLocales.organisation_id == current_user.organisation_id
    ).delete()
    db.commit()
    return {"message": "Ressources remises en calcul automatique"}

@app.post("/auth/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Ne pas révéler si l'email existe
        return {"message": "Si cet email existe, vous recevrez un lien de réinitialisation."}

    # Invalider les anciens tokens
    db.query(models.PasswordReset).filter(
        models.PasswordReset.email == data.email,
        models.PasswordReset.used == False
    ).delete()

    # Créer nouveau token
    token = secrets_module.token_urlsafe(32)
    reset = models.PasswordReset(
        email=data.email,
        token=token,
        date_expiration=datetime.utcnow() + timedelta(hours=2)
    )
    db.add(reset)
    db.commit()

    # Envoyer email
    reset_url = f"{os.getenv('APP_URL', 'https://salama-data.onrender.com')}/reset-password?token={token}"
    send_reset_password_email(
        to_email=data.email,
        prenom=user.prenom,
        nom=user.nom,
        reset_url=reset_url
    )

    return {"message": "Si cet email existe, vous recevrez un lien de réinitialisation."}

@app.post("/auth/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    reset = db.query(models.PasswordReset).filter(
        models.PasswordReset.token == data.token,
        models.PasswordReset.used == False
    ).first()

    if not reset:
        raise HTTPException(status_code=400, detail="Token invalide ou déjà utilisé")

    if datetime.utcnow() > reset.date_expiration:
        raise HTTPException(status_code=400, detail="Token expiré — demandez un nouveau lien")

    user = db.query(User).filter(User.email == reset.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    user.hashed_password = hash_password(data.new_password)
    reset.used = True
    db.commit()

    return {"message": "Mot de passe réinitialisé avec succès"}

@app.post("/auth/change-password")
def change_password(
    old_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    current_user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Mot de passe changé avec succès"}

@app.get("/rapport/pdf")
def generer_rapport_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    org_id = current_user.organisation_id
    
    # Collecte des données
    beneficiaires = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id
    ).all()
    
    zones = db.query(models.Zone).filter(
        models.Zone.organisation_id == org_id
    ).all()
    
    personnel = db.query(models.PersonnelSante).filter(
        models.PersonnelSante.organisation_id == org_id
    ).all()
    
    org = db.query(models.Organisation).filter(
        models.Organisation.id == org_id
    ).first()
    
    total = len(beneficiaires)
    verifies = sum(1 for b in beneficiaires if b.verifie)
    doublons = sum(1 for b in beneficiaires if b.doublon_detecte)
    vulnerables = sum(1 for b in beneficiaires if b.groupe_vulnerable and b.groupe_vulnerable != 'Aucun')
    besoin_eau = sum(1 for b in beneficiaires if b.besoin_eau)
    besoin_alim = sum(1 for b in beneficiaires if b.besoin_alimentation)
    besoin_abri = sum(1 for b in beneficiaires if b.besoin_abri)
    besoin_sante = sum(1 for b in beneficiaires if b.besoin_sante)
    besoin_educ = sum(1 for b in beneficiaires if b.besoin_education)
    personnel_dispo = sum(1 for p in personnel if p.disponibilite)

    # Création PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    # Couleurs
    BLUE_DARK  = colors.HexColor('#0D2E4E')
    BLUE       = colors.HexColor('#1A4B7A')
    GREEN      = colors.HexColor('#1D9E75')
    GREEN_DARK = colors.HexColor('#085041')
    GRAY       = colors.HexColor('#64748B')
    LIGHT_GRAY = colors.HexColor('#F8FAFC')
    BORDER     = colors.HexColor('#DDE3EC')
    RED        = colors.HexColor('#A32D2D')
    AMBER      = colors.HexColor('#92400E')

    styles = getSampleStyleSheet()
    
    def style(name, **kwargs):
        return ParagraphStyle(name, **kwargs)

    title_style    = style('Title',    fontSize=22, textColor=colors.white, fontName='Helvetica-Bold', alignment=TA_CENTER)
    subtitle_style = style('Subtitle', fontSize=11, textColor=colors.HexColor('#7FB3D3'), fontName='Helvetica', alignment=TA_CENTER)
    h1_style       = style('H1',       fontSize=14, textColor=BLUE_DARK, fontName='Helvetica-Bold', spaceAfter=8, spaceBefore=16)
    h2_style       = style('H2',       fontSize=11, textColor=BLUE, fontName='Helvetica-Bold', spaceAfter=6, spaceBefore=10)
    body_style     = style('Body',     fontSize=9,  textColor=GRAY, fontName='Helvetica', spaceAfter=4, leading=14)
    small_style    = style('Small',    fontSize=8,  textColor=GRAY, fontName='Helvetica')
    footer_style   = style('Footer',   fontSize=8,  textColor=GRAY, fontName='Helvetica', alignment=TA_CENTER)
    right_style    = style('Right',    fontSize=9,  textColor=GRAY, fontName='Helvetica', alignment=TA_RIGHT)

    story = []
    date_rapport = datetime.utcnow().strftime("%d/%m/%Y à %H:%M UTC")
    org_nom = org.nom if org else "Organisation"

    # ─── EN-TÊTE ──────────────────────────────────────────────────
    header_data = [[
        Paragraph("<b>SALAMA DATA</b>", style('H_title', fontSize=20, textColor=colors.white, fontName='Helvetica-Bold')),
        Paragraph(f"<b>RAPPORT HUMANITAIRE</b><br/><font size='9'>{org_nom} · {date_rapport}</font>",
                  style('H_sub', fontSize=13, textColor=colors.white, fontName='Helvetica-Bold', alignment=TA_RIGHT))
    ]]
    header_table = Table(header_data, colWidths=[9*cm, 8*cm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BLUE_DARK),
        ('PADDING', (0,0), (-1,-1), 16),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5*cm))

    # Sous-titre
    story.append(Paragraph(
        f"Plateforme humanitaire · Goma, Nord-Kivu, RDC · Généré le {date_rapport}",
        style('sub', fontSize=8, textColor=GRAY, fontName='Helvetica', alignment=TA_CENTER)
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=12))

    # ─── RÉSUMÉ EXÉCUTIF ──────────────────────────────────────────
    story.append(Paragraph("1. RÉSUMÉ EXÉCUTIF", h1_style))

    kpi_data = [
        [
            Paragraph(f"<b><font color='#085041' size='18'>{total}</font></b><br/><font size='8' color='#64748B'>Bénéficiaires enregistrés</font>", style('kpi', alignment=TA_CENTER)),
            Paragraph(f"<b><font color='#1A4B7A' size='18'>{len(zones)}</font></b><br/><font size='8' color='#64748B'>Zones couvertes</font>", style('kpi2', alignment=TA_CENTER)),
            Paragraph(f"<b><font color='#92400E' size='18'>{len(personnel)}</font></b><br/><font size='8' color='#64748B'>Personnel de santé</font>", style('kpi3', alignment=TA_CENTER)),
            Paragraph(f"<b><font color='#A32D2D' size='18'>{vulnerables}</font></b><br/><font size='8' color='#64748B'>Personnes vulnérables</font>", style('kpi4', alignment=TA_CENTER)),
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[4.25*cm]*4)
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#E1F5EE')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#E6F4FB')),
        ('BACKGROUND', (2,0), (2,0), colors.HexColor('#FEF3C7')),
        ('BACKGROUND', (3,0), (3,0), colors.HexColor('#FCEBEB')),
        ('BOX', (0,0), (0,0), 1, colors.HexColor('#9FE1CB')),
        ('BOX', (1,0), (1,0), 1, colors.HexColor('#B5D4F4')),
        ('BOX', (2,0), (2,0), 1, colors.HexColor('#FCD34D')),
        ('BOX', (3,0), (3,0), 1, colors.HexColor('#F7C1C1')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 14),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 0.4*cm))

    # Texte résumé
    pct_verifies = round((verifies/total*100), 1) if total > 0 else 0
    story.append(Paragraph(
        f"Ce rapport couvre <b>{total} bénéficiaires</b> enregistrés dans le système Salama Data pour "
        f"<b>{org_nom}</b>. Parmi eux, <b>{verifies} ({pct_verifies}%)</b> ont été vérifiés, "
        f"<b>{vulnerables}</b> appartiennent à des groupes vulnérables et <b>{doublons}</b> doublons "
        f"ont été détectés. <b>{len(zones)} zones</b> sont couvertes avec <b>{personnel_dispo} agents de santé</b> disponibles.",
        body_style
    ))

    # ─── ANALYSE DES BESOINS ──────────────────────────────────────
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("2. ANALYSE DES BESOINS PRIORITAIRES", h1_style))

    besoins_data = [
        ['Secteur', 'Bénéficiaires', '% du total', 'Priorité'],
        ['Eau & Assainissement', str(besoin_eau), f"{round(besoin_eau/total*100,1) if total>0 else 0}%", 'CRITIQUE' if besoin_eau > total*0.5 else 'MODÉRÉE'],
        ['Alimentation', str(besoin_alim), f"{round(besoin_alim/total*100,1) if total>0 else 0}%", 'CRITIQUE' if besoin_alim > total*0.5 else 'MODÉRÉE'],
        ['Abri d\'urgence', str(besoin_abri), f"{round(besoin_abri/total*100,1) if total>0 else 0}%", 'CRITIQUE' if besoin_abri > total*0.5 else 'MODÉRÉE'],
        ['Soins de santé', str(besoin_sante), f"{round(besoin_sante/total*100,1) if total>0 else 0}%", 'CRITIQUE' if besoin_sante > total*0.5 else 'MODÉRÉE'],
        ['Éducation', str(besoin_educ), f"{round(besoin_educ/total*100,1) if total>0 else 0}%", 'MODÉRÉE'],
    ]
    besoins_table = Table(besoins_data, colWidths=[6*cm, 3.5*cm, 3*cm, 4.5*cm])
    besoins_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BLUE_DARK),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR', (3,1), (3,-1), RED),
        ('FONTNAME', (3,1), (3,-1), 'Helvetica-Bold'),
    ]))
    story.append(besoins_table)

    # ─── ZONES D'INTERVENTION ─────────────────────────────────────
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("3. ZONES D'INTERVENTION", h1_style))

    if zones:
        zones_data = [['Zone', 'Déplacés', 'Personnel', 'Ratio', 'Criticité']]
        for z in zones:
            nb_personnel_zone = db.query(models.PersonnelSante).filter(
                models.PersonnelSante.zone == z.nom,
                models.PersonnelSante.organisation_id == org_id
            ).count()
            ratio = z.nb_deplaces // max(nb_personnel_zone, 1)
            if ratio > 1000:
                criticite = 'CRITIQUE'
            elif ratio > 500:
                criticite = 'TENSION'
            else:
                criticite = 'STABLE'
            zones_data.append([
                z.nom,
                str(z.nb_deplaces),
                str(nb_personnel_zone),
                str(ratio),
                criticite
            ])
        zones_table = Table(zones_data, colWidths=[5*cm, 3*cm, 3*cm, 3*cm, 3*cm])
        zones_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BLUE),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
            ('ALIGN', (0,0), (0,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 7),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
            ('GRID', (0,0), (-1,-1), 0.5, BORDER),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ]))
        story.append(zones_table)
    else:
        story.append(Paragraph("Aucune zone enregistrée.", body_style))

    # ─── LISTE BÉNÉFICIAIRES ──────────────────────────────────────
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("4. LISTE DES BÉNÉFICIAIRES", h1_style))
    story.append(Paragraph(
        f"Les {min(50, total)} premiers bénéficiaires enregistrés (sur {total} au total).",
        body_style
    ))

    if beneficiaires:
        benef_data = [['#', 'Nom complet', 'Âge/Sexe', 'Zone', 'Groupe', 'Besoins', 'Vérifié']]
        for i, b in enumerate(beneficiaires[:50]):
            besoins = []
            if b.besoin_eau: besoins.append('Eau')
            if b.besoin_alimentation: besoins.append('Alim')
            if b.besoin_abri: besoins.append('Abri')
            if b.besoin_sante: besoins.append('Santé')
            if b.besoin_education: besoins.append('Éduc')
            benef_data.append([
                str(b.id),
                f"{b.prenom} {b.nom}",
                f"{b.age or '?'}/{b.sexe or '?'}",
                (b.zone_origine or b.site_deplacement or '—')[:15],
                (b.groupe_vulnerable or '—')[:15],
                ', '.join(besoins) if besoins else '—',
                'Oui' if b.verifie else 'Non'
            ])
        benef_table = Table(benef_data, colWidths=[1*cm, 4*cm, 2*cm, 3*cm, 3*cm, 3*cm, 1.5*cm])
        benef_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BLUE_DARK),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 7),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('ALIGN', (1,0), (1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
            ('GRID', (0,0), (-1,-1), 0.5, BORDER),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ]))
        story.append(benef_table)
    else:
        story.append(Paragraph("Aucun bénéficiaire enregistré.", body_style))

    # ─── PIED DE PAGE ─────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 0.2*cm))

    footer_data = [[
        Paragraph(f"<b>Salama Data</b> · {org_nom}", small_style),
        Paragraph(f"Généré le {date_rapport}", style('fc', fontSize=8, textColor=GRAY, alignment=TA_CENTER)),
        Paragraph("<b>Umande Investment Limited</b> · Goma, RDC", style('fr', fontSize=8, textColor=GRAY, alignment=TA_RIGHT))
    ]]
    footer_table = Table(footer_data, colWidths=[5.67*cm, 5.67*cm, 5.67*cm])
    footer_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(footer_table)

    # Build PDF
    doc.build(story)
    buffer.seek(0)

    filename = f"rapport_salama_{org_nom.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )