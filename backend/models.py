from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
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

class Beneficiaire(Base):
    __tablename__ = "beneficiaires"
    id              = Column(Integer, primary_key=True, index=True)
    nom             = Column(String, nullable=False)
    prenom          = Column(String, nullable=False)
    age             = Column(Integer)
    sexe            = Column(String)
    zone_origine    = Column(String)
    site_deplacement= Column(String)
    nb_dependants   = Column(Integer, default=0)
    latitude        = Column(Float)
    longitude       = Column(Float)
    agent_id        = Column(String)
    synced          = Column(Boolean, default=False)
    date_enregistrement = Column(DateTime, default=datetime.utcnow)

class Collecte(Base):
    __tablename__ = "collectes"
    id          = Column(Integer, primary_key=True, index=True)
    agent_id    = Column(String)
    zone        = Column(String)
    nb_fiches   = Column(Integer, default=0)
    synced      = Column(Boolean, default=False)
    date_collecte = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()