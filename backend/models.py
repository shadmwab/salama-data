from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./salama.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id                  = Column(Integer, primary_key=True, index=True)
    nom                 = Column(String, nullable=False)
    prenom              = Column(String, nullable=False)
    email               = Column(String, unique=True, index=True, nullable=False)
    hashed_password     = Column(String, nullable=False)
    role                = Column(String, default="agent")
    organisation_id     = Column(Integer, default=1)
    is_active           = Column(Boolean, default=True)
    date_creation       = Column(DateTime, default=datetime.utcnow)
    derniere_connexion  = Column(DateTime, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"
    id              = Column(Integer, primary_key=True, index=True)
    type            = Column(String, nullable=False)
    titre           = Column(String, nullable=False)
    message         = Column(Text, nullable=False)
    niveau          = Column(String, default="info")
    lu              = Column(Boolean, default=False)
    organisation_id = Column(Integer, default=1)
    date_creation   = Column(DateTime, default=datetime.utcnow)
    
class Beneficiaire(Base):
    __tablename__ = "beneficiaires"
    id                  = Column(Integer, primary_key=True, index=True)
    # Identité
    nom                 = Column(String, nullable=False)
    prenom              = Column(String, nullable=False)
    age                 = Column(Integer)
    sexe                = Column(String)
    telephone           = Column(String, nullable=True)
    numero_cni          = Column(String, nullable=True)
    photo_cni           = Column(Text, nullable=True)
    # Famille
    nom_referent        = Column(String, nullable=True)
    telephone_referent  = Column(String, nullable=True)
    # Localisation
    zone_origine        = Column(String)
    site_deplacement    = Column(String)
    nb_dependants       = Column(Integer, default=0)
    latitude            = Column(Float)
    longitude           = Column(Float)
    # Vulnérabilité
    groupe_vulnerable   = Column(String, nullable=True)
    # Besoins prioritaires
    besoin_eau          = Column(Boolean, default=False)
    besoin_alimentation = Column(Boolean, default=False)
    besoin_abri         = Column(Boolean, default=False)
    besoin_sante        = Column(Boolean, default=False)
    besoin_education    = Column(Boolean, default=False)
    # Aide reçue
    aide_alimentaire    = Column(Boolean, default=False)
    aide_abri           = Column(Boolean, default=False)
    aide_medicale       = Column(Boolean, default=False)
    # Statut
    agent_id            = Column(String)
    organisation_id     = Column(Integer, default=1)
    synced              = Column(Boolean, default=False)
    verifie             = Column(Boolean, default=False)
    doublon_detecte     = Column(Boolean, default=False)
    notes               = Column(Text, nullable=True)
    date_enregistrement = Column(DateTime, default=datetime.utcnow)

class PersonnelSante(Base):
    __tablename__ = "personnel_sante"
    id              = Column(Integer, primary_key=True, index=True)
    nom             = Column(String, nullable=False)
    prenom          = Column(String, nullable=False)
    specialite      = Column(String, nullable=False)
    telephone       = Column(String, nullable=True)
    email           = Column(String, nullable=True)
    latitude        = Column(Float, nullable=True)
    longitude       = Column(Float, nullable=True)
    zone            = Column(String, nullable=True)
    disponibilite   = Column(Boolean, default=True)
    statut          = Column(String, default="actif")
    organisation_id = Column(Integer, default=1)
    date_ajout      = Column(DateTime, default=datetime.utcnow)

class Affectation(Base):
    __tablename__ = "affectations"
    id              = Column(Integer, primary_key=True, index=True)
    personnel_id    = Column(Integer, nullable=False)
    zone            = Column(String, nullable=False)
    date_debut      = Column(DateTime, default=datetime.utcnow)
    date_fin        = Column(DateTime, nullable=True)
    statut          = Column(String, default="active")
    notes           = Column(Text, nullable=True)
    organisation_id = Column(Integer, default=1)
    created_by      = Column(Integer, nullable=True)

class Zone(Base):
    __tablename__ = "zones"
    id                  = Column(Integer, primary_key=True, index=True)
    nom                 = Column(String, nullable=False)
    latitude            = Column(Float, nullable=True)
    longitude           = Column(Float, nullable=True)
    nb_deplaces         = Column(Integer, default=0)
    description         = Column(Text, nullable=True)
    organisation_id     = Column(Integer, default=1)
    date_creation       = Column(DateTime, default=datetime.utcnow)

class Collecte(Base):
    __tablename__ = "collectes"
    id            = Column(Integer, primary_key=True, index=True)
    agent_id      = Column(String)
    zone          = Column(String)
    nb_fiches     = Column(Integer, default=0)
    organisation_id = Column(Integer, default=1)
    synced        = Column(Boolean, default=False)
    date_collecte = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, nullable=True)
    user_email      = Column(String, nullable=True)
    user_role       = Column(String, nullable=True)
    action          = Column(String, nullable=False)
    details         = Column(Text, nullable=True)
    ip_address      = Column(String, nullable=True)
    organisation_id = Column(Integer, default=1)
    timestamp       = Column(DateTime, default=datetime.utcnow)

class Organisation(Base):
    __tablename__ = "organisations"
    id           = Column(Integer, primary_key=True, index=True)
    nom          = Column(String, nullable=False)
    type_org     = Column(String, default="ONG")
    email        = Column(String, nullable=False)
    telephone    = Column(String, nullable=True)
    ville        = Column(String, default="Goma")
    pays         = Column(String, default="RDC")
    is_active    = Column(Boolean, default=True)
    date_creation = Column(DateTime, default=datetime.utcnow)

class OrgRequest(Base):
    __tablename__ = "org_requests"
    id            = Column(Integer, primary_key=True, index=True)
    org_name      = Column(String, nullable=False)
    contact_name  = Column(String, nullable=False)
    email         = Column(String, nullable=False)
    phone         = Column(String, nullable=True)
    type_org      = Column(String, default="ONG")
    message       = Column(Text, nullable=True)
    status        = Column(String, default="pending")
    date_demande  = Column(DateTime, default=datetime.utcnow)
    date_traitement = Column(DateTime, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()