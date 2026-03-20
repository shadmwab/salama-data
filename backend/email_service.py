import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
import os
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
APP_URL = os.getenv("APP_URL", "https://salama-data.onrender.com")
SUPER_ADMIN_EMAIL = os.getenv("SUPER_ADMIN_EMAIL", "shadmwab@gmail.com")

def get_api():
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

def send_email(to_email: str, to_name: str, subject: str, html: str) -> bool:
    try:
        api = get_api()
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": to_name}],
            sender={"email": "noreply@salama-data.org", "name": "Salama Data"},
            subject=subject,
            html_content=html
        )
        api.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        print(f"Brevo error: {e}")
        return False

def send_welcome_agent(to_email: str, prenom: str, nom: str, role: str, password: str, org_name: str):
    role_labels = {"admin": "Administrateur", "manager": "Manager / Coordinateur", "agent": "Agent terrain"}
    role_label = role_labels.get(role, role)
    html = f"""
    <div style="font-family: Poppins, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f8; padding: 2rem;">
        <div style="background: #0D2E4E; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
            <h1 style="color: white; font-size: 24px; margin: 0;">SALAMA DATA</h1>
            <p style="color: #7FB3D3; margin: 4px 0 0; font-size: 13px;">Plateforme humanitaire · RDC</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid #DDE3EC;">
            <h2 style="color: #0D2E4E; font-size: 18px;">Bonjour {prenom} {nom},</h2>
            <p style="color: #64748B; font-size: 14px; line-height: 1.6;">
                Votre compte Salama Data a été créé avec succès pour l'organisation <strong>{org_name}</strong>.
            </p>
            <div style="background: #E6F4FB; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; border: 1px solid #B5D4F4;">
                <p style="color: #185FA5; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 0 0 12px;">Vos identifiants de connexion</p>
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="color: #64748B; padding: 4px 0;">Email</td><td style="color: #0D2E4E; font-weight: 600;">{to_email}</td></tr>
                    <tr><td style="color: #64748B; padding: 4px 0;">Mot de passe</td><td style="color: #0D2E4E; font-weight: 600;">{password}</td></tr>
                    <tr><td style="color: #64748B; padding: 4px 0;">Rôle</td><td style="color: #0D2E4E; font-weight: 600;">{role_label}</td></tr>
                    <tr><td style="color: #64748B; padding: 4px 0;">Organisation</td><td style="color: #0D2E4E; font-weight: 600;">{org_name}</td></tr>
                </table>
            </div>
            <div style="text-align: center; margin: 1.5rem 0;">
                <a href="{APP_URL}" style="background: #1A4B7A; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
                    → Se connecter à Salama Data
                </a>
            </div>
            <p style="color: #94A3B8; font-size: 12px; margin-top: 1.5rem;">
                Pour des raisons de sécurité, veuillez changer votre mot de passe après votre première connexion.
            </p>
        </div>
        <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 1rem;">
            © 2026 Salama Data · Développé par UMANDE INVESTMENT LIMITED · Goma, RDC
        </p>
    </div>
    """
    return send_email(to_email, f"{prenom} {nom}", "Bienvenue sur Salama Data — Vos identifiants", html)

def send_org_request_notification(org_name: str, contact_name: str, email: str, phone: str, message: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f8; padding: 2rem;">
        <div style="background: #0D2E4E; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
            <h1 style="color: white; font-size: 24px; margin: 0;">SALAMA DATA</h1>
            <p style="color: #7FB3D3; margin: 4px 0 0;">Nouvelle demande d'organisation</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid #DDE3EC;">
            <h2 style="color: #A32D2D; font-size: 18px;">Nouvelle organisation souhaite rejoindre</h2>
            <div style="background: #F8FAFC; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="color: #64748B; padding: 6px 0;">Organisation</td><td style="font-weight: 600; color: #0D2E4E;">{org_name}</td></tr>
                    <tr><td style="color: #64748B; padding: 6px 0;">Contact</td><td style="font-weight: 600; color: #0D2E4E;">{contact_name}</td></tr>
                    <tr><td style="color: #64748B; padding: 6px 0;">Email</td><td style="font-weight: 600; color: #0D2E4E;">{email}</td></tr>
                    <tr><td style="color: #64748B; padding: 6px 0;">Téléphone</td><td style="font-weight: 600; color: #0D2E4E;">{phone}</td></tr>
                </table>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #DDE3EC;">
                    <p style="color: #64748B; font-size: 12px; margin: 0 0 4px;">Message</p>
                    <p style="color: #0D2E4E; font-size: 14px; margin: 0;">{message}</p>
                </div>
            </div>
            <div style="text-align: center;">
                <a href="{APP_URL}" style="background: #1A4B7A; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
                    → Connectez-vous pour approuver
                </a>
            </div>
        </div>
    </div>
    """
    return send_email(SUPER_ADMIN_EMAIL, "Shadrack", f"Nouvelle demande — {org_name}", html)

def send_org_approved(to_email: str, org_name: str, contact_name: str, admin_password: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f8; padding: 2rem;">
        <div style="background: #0D2E4E; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
            <h1 style="color: white; font-size: 24px; margin: 0;">SALAMA DATA</h1>
            <p style="color: #7FB3D3; margin: 4px 0 0;">Demande approuvée</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid #DDE3EC;">
            <h2 style="color: #085041;">Votre organisation a été approuvée !</h2>
            <p style="color: #64748B; font-size: 14px;">Bonjour {contact_name},</p>
            <p style="color: #64748B; font-size: 14px; line-height: 1.6;">
                Votre organisation <strong>{org_name}</strong> a été approuvée sur Salama Data.
                Voici vos identifiants administrateur :
            </p>
            <div style="background: #E1F5EE; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; border: 1px solid #9FE1CB;">
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="color: #64748B; padding: 4px 0;">Email admin</td><td style="font-weight: 600; color: #085041;">{to_email}</td></tr>
                    <tr><td style="color: #64748B; padding: 4px 0;">Mot de passe</td><td style="font-weight: 600; color: #085041;">{admin_password}</td></tr>
                    <tr><td style="color: #64748B; padding: 4px 0;">Organisation</td><td style="font-weight: 600; color: #085041;">{org_name}</td></tr>
                </table>
            </div>
            <div style="text-align: center; margin: 1.5rem 0;">
                <a href="{APP_URL}" style="background: #1D9E75; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
                    → Accéder à Salama Data
                </a>
            </div>
        </div>
        <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 1rem;">
            © 2026 Salama Data · Goma, RDC
        </p>
    </div>
    """
    return send_email(to_email, contact_name, f"Votre organisation {org_name} a été approuvée — Salama Data", html)
