from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import models
from agent import interroger_agent

models.init_db()

app = FastAPI(title="Salama Data API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Salama Data API v1.0", "status": "online"}

@app.post("/beneficiaires")
def creer_beneficiaire(data: BeneficiaireCreate, db: Session = Depends(models.get_db)):
    b = models.Beneficiaire(**data.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return {"id": b.id, "message": "Bénéficiaire enregistré avec succès"}

@app.get("/beneficiaires")
def lister_beneficiaires(db: Session = Depends(models.get_db)):
    return db.query(models.Beneficiaire).all()

@app.get("/dashboard")
def dashboard(db: Session = Depends(models.get_db)):
    total = db.query(models.Beneficiaire).count()
    zones = db.query(models.Beneficiaire.zone_origine).distinct().all()
    agents = db.query(models.Beneficiaire.agent_id).distinct().count()
    ce_mois = db.query(models.Collecte).filter(
        models.Collecte.date_collecte >= datetime.utcnow() - timedelta(days=30)
    ).count()
    return {
        "total_beneficiaires": total,
        "zones": [z[0] for z in zones if z[0]],
        "nb_agents": agents,
        "collectes_mois": ce_mois,
    }

@app.post("/agent")
def poser_question(body: AgentQuestion, db: Session = Depends(models.get_db)):
    stats = db.query(models.Beneficiaire).count()
    zones = db.query(models.Beneficiaire.zone_origine).distinct().all()
    agents = db.query(models.Beneficiaire.agent_id).distinct().count()
    contexte = {
        "total_beneficiaires": stats,
        "zones": [z[0] for z in zones if z[0]],
        "nb_agents": agents,
        "collectes_mois": 0,
    }
    reponse = interroger_agent(body.question, contexte)
    return {"reponse": reponse}