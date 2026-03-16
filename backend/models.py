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

class Beneficiaire(Base):
    __tablename__ = "beneficiaires"
    id                  = Column(Integer, primary_key=True, index=True)
    nom                 = Column(String, nullable=False)
    prenom              = Column(String, nullable=False)
    age                 = Column(Integer)
    sexe                = Column(String)
    zone_origine        = Column(String)
    site_deplacement    = Column(String)
    nb_dependants       = Column(Integer, default=0)
    latitude            = Column(Float)
    longitude           = Column(Float)
    agent_id            = Column(String)
    organisation_id     = Column(Integer, default=1)
    synced              = Column(Boolean, default=False)
    date_enregistrement = Column(DateTime, default=datetime.utcnow)

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

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()