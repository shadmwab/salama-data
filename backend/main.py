from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import models
from models import get_db, AuditLog, User
from agent import interroger_agent
from auth import (
    hash_password, verify_password, create_token,
    get_current_user, require_role, ACCESS_TOKEN_EXPIRE_MINUTES
)

models.init_db()

app = FastAPI(title="Salama Data API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def log_action(db: Session, action: str, details: str = None,
               user=None, request: Request = None):
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
            nom="Admin",
            prenom="Salama",
            email="admin@salama-data.org",
            hashed_password=hash_password("Salama2026!"),
            role="admin",
            organisation_id=1,
            is_active=True
        )
        db.add(admin)
        db.commit()

db_init = next(get_db())
create_default_admin(db_init)

# ── Schemas ──────────────────────────────────────────────────────────────────
class BeneficiaireCreate(BaseModel):
    nom: str
    prenom: str
    age: Optional[int] = None
    sexe: Optional[str] = None
    zone_origine: Optional[str] = None
    site_deplacement: Optional[str] = None
    nb_dependants: int = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    agent_id: Optional[str] = None

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

# ── Auth Routes ───────────────────────────────────────────────────────────────
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

    log_action(db, "LOGIN_SUCCESS", f"Connexion réussie", user=user, request=request)

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

# ── User Management (Admin only) ──────────────────────────────────────────────
@app.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    users = db.query(User).filter(User.organisation_id == current_user.organisation_id).all()
    return [{"id": u.id, "nom": u.nom, "prenom": u.prenom, "email": u.email,
             "role": u.role, "is_active": u.is_active,
             "derniere_connexion": u.derniere_connexion} for u in users]

@app.post("/users")
def create_user(
    data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
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
    log_action(db, "USER_CREATED", f"Nouvel utilisateur: {data.email} ({data.role})", user=current_user, request=request)
    return {"id": user.id, "message": f"Utilisateur {user.prenom} {user.nom} créé avec succès"}

@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    data: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
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
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de supprimer votre propre compte")
    db.delete(user)
    db.commit()
    log_action(db, "USER_DELETED", f"Utilisateur {user.email} supprimé", user=current_user, request=request)
    return {"message": "Utilisateur supprimé"}

# ── Audit Log (Admin + Manager) ────────────────────────────────────────────────
@app.get("/audit")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    logs = db.query(AuditLog).filter(
        AuditLog.organisation_id == current_user.organisation_id
    ).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return logs

# ── Data Routes ───────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Salama Data API v2.0", "status": "online"}

@app.post("/beneficiaires")
def creer_beneficiaire(
    data: BeneficiaireCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = models.Beneficiaire(
        **data.model_dump(),
        organisation_id=current_user.organisation_id
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    log_action(db, "BENEFICIAIRE_CREATED",
               f"Bénéficiaire {data.prenom} {data.nom} enregistré",
               user=current_user, request=request)
    return {"id": b.id, "message": "Bénéficiaire enregistré avec succès"}

@app.get("/beneficiaires")
def lister_beneficiaires(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    return db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == current_user.organisation_id
    ).all()

@app.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organisation_id
    total = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id
    ).count()
    zones = db.query(models.Beneficiaire.zone_origine).filter(
        models.Beneficiaire.organisation_id == org_id
    ).distinct().all()
    agents = db.query(models.Beneficiaire.agent_id).filter(
        models.Beneficiaire.organisation_id == org_id
    ).distinct().count()
    return {
        "total_beneficiaires": total,
        "zones": [z[0] for z in zones if z[0]],
        "nb_agents": agents,
        "collectes_mois": 0,
        "user_role": current_user.role
    }

@app.post("/agent")
def poser_question(
    body: AgentQuestion,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager"))
):
    org_id = current_user.organisation_id
    total = db.query(models.Beneficiaire).filter(
        models.Beneficiaire.organisation_id == org_id
    ).count()
    zones = db.query(models.Beneficiaire.zone_origine).filter(
        models.Beneficiaire.organisation_id == org_id
    ).distinct().all()
    agents = db.query(models.Beneficiaire.agent_id).filter(
        models.Beneficiaire.organisation_id == org_id
    ).distinct().count()
    contexte = {
        "total_beneficiaires": total,
        "zones": [z[0] for z in zones if z[0]],
        "nb_agents": agents,
        "collectes_mois": 0,
    }
    reponse = interroger_agent(body.question, contexte)
    log_action(db, "AGENT_QUERY", f"Question: {body.question[:100]}", user=current_user, request=request)
    return {"reponse": reponse}