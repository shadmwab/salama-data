import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
APP_URL = os.getenv("APP_URL", "https://salama-data.onrender.com")
SUPER_ADMIN_EMAIL = os.getenv("SUPER_ADMIN_EMAIL", "shadmwab@gmail.com")

def send_email(to_email: str, subject: str, html: str) -> bool:
    try:
        resend.Emails.send({
            "from": "Salama Data <onboarding@resend.dev>",
            "to": SUPER_ADMIN_EMAIL,  # Plan gratuit — tout vers admin
            "reply_to": to_email,
            "subject": subject,
            "html": html
        })
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_welcome_agent(to_email: str, prenom: str, nom: str, role: str, password: str, org_name: str):
    role_labels = {"admin": "Administrateur", "manager": "Manager", "agent": "Agent terrain"}
    role_label = role_labels.get(role, role)
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f8; padding: 2rem;">
        <div style="background: #0D2E4E; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
            <h1 style="color: white; font-size: 24px; margin: 0;">SALAMA DATA</h1>
            <p style="color: #7FB3D3; margin: 4px 0 0;">Nouveau compte créé</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid #DDE3EC;">
            <h2 style="color: #0D2E4E;">Nouveau compte — {prenom} {nom}</h2>
            <p style="color: #64748B;">Organisation : <strong>{org_name}</strong></p>
            <div style="background: #E6F4FB; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; border: 1px solid #B5D4F4;">
                <p style="color: #185FA5; font-weight: 700; margin: 0 0 10px;">Identifiants à transmettre à {prenom} :</p>
                <p style="margin: 4px 0;">📧 Email : <strong>{to_email}</strong></p>
                <p style="margin: 4px 0;">🔑 Mot de passe : <strong>{password}</strong></p>
                <p style="margin: 4px 0;">👤 Rôle : <strong>{role_label}</strong></p>
            </div>
            <div style="text-align: center; margin-top: 1rem;">
                <a href="{APP_URL}" style="background: #1A4B7A; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700;">
                    → Accéder à Salama Data
                </a>
            </div>
        </div>
        <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 1rem;">
            © 2026 Salama Data · Umande Investment Limited · Goma, RDC
        </p>
    </div>
    """
    return send_email(to_email, f"Nouveau compte Salama Data — {prenom} {nom}", html)

def send_org_request_notification(org_name: str, contact_name: str, email: str, phone: str, message: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f8; padding: 2rem;">
        <div style="background: #0D2E4E; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
            <h1 style="color: white; font-size: 24px; margin: 0;">SALAMA DATA</h1>
            <p style="color: #7FB3D3; margin: 4px 0 0;">Nouvelle demande d'organisation</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid #DDE3EC;">
            <h2 style="color: #A32D2D;">Nouvelle organisation souhaite rejoindre</h2>
            <table style="width: 100%; font-size: 14px;">
                <tr><td style="color: #64748B; padding: 6px 0;">Organisation</td><td style="font-weight: 600;">{org_name}</td></tr>
                <tr><td style="color: #64748B; padding: 6px 0;">Contact</td><td style="font-weight: 600;">{contact_name}</td></tr>
                <tr><td style="color: #64748B; padding: 6px 0;">Email</td><td style="font-weight: 600;">{email}</td></tr>
                <tr><td style="color: #64748B; padding: 6px 0;">Téléphone</td><td style="font-weight: 600;">{phone}</td></tr>
                <tr><td style="color: #64748B; padding: 6px 0;">Message</td><td style="font-weight: 600;">{message}</td></tr>
            </table>
            <div style="text-align: center; margin-top: 1.5rem;">
                <a href="{APP_URL}" style="background: #1A4B7A; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700;">
                    → Connectez-vous pour approuver
                </a>
            </div>
        </div>
        <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 1rem;">
            © 2026 Salama Data · Umande Investment Limited · Goma, RDC
        </p>
    </div>
    """
    return send_email(SUPER_ADMIN_EMAIL, f"🔔 Nouvelle demande — {org_name}", html)

def send_org_approved(to_email: str, org_name: str, contact_name: str, admin_password: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f8; padding: 2rem;">
        <div style="background: #0D2E4E; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
            <h1 style="color: white; font-size: 24px; margin: 0;">SALAMA DATA</h1>
            <p style="color: #7FB3D3; margin: 4px 0 0;">Organisation approuvée</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid #DDE3EC;">
            <h2 style="color: #085041;">Organisation {org_name} approuvée</h2>
            <p style="color: #64748B;">Contact : <strong>{contact_name}</strong> ({to_email})</p>
            <div style="background: #E1F5EE; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; border: 1px solid #9FE1CB;">
                <p style="color: #085041; font-weight: 700; margin: 0 0 10px;">Identifiants admin à transmettre :</p>
                <p style="margin: 4px 0;">📧 Email : <strong>{to_email}</strong></p>
                <p style="margin: 4px 0;">🔑 Mot de passe : <strong>{admin_password}</strong></p>
                <p style="margin: 4px 0;">🏢 Organisation : <strong>{org_name}</strong></p>
            </div>
            <div style="background: #FEF3C7; border-radius: 8px; padding: 12px; border: 1px solid #FCD34D; margin-top: 1rem;">
                <p style="color: #92400E; font-size: 13px; margin: 0;">
                    ⚠️ Transmettez ces identifiants directement à {contact_name} par téléphone ou WhatsApp.
                </p>
            </div>
        </div>
        <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 1rem;">
            © 2026 Salama Data · Umande Investment Limited · Goma, RDC
        </p>
    </div>
    """
    return send_email(SUPER_ADMIN_EMAIL, f"✅ Organisation {org_name} approuvée", html)

def send_reset_password_email(to_email: str, prenom: str, nom: str, reset_url: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f8; padding: 2rem;">
        <div style="background: #0D2E4E; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
            <h1 style="color: white; font-size: 24px; margin: 0;">SALAMA DATA</h1>
            <p style="color: #7FB3D3; margin: 4px 0 0;">Réinitialisation du mot de passe</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid #DDE3EC;">
            <h2 style="color: #0D2E4E;">Demande de reset — {prenom} {nom}</h2>
            <p style="color: #64748B;">Email : <strong>{to_email}</strong></p>
            <div style="background: #E6F4FB; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; border: 1px solid #B5D4F4;">
                <p style="color: #185FA5; font-weight: 700; margin: 0 0 10px;">Lien de réinitialisation :</p>
                <p style="margin: 0; word-break: break-all;"><a href="{reset_url}" style="color: #1A4B7A;">{reset_url}</a></p>
                <p style="color: #64748B; font-size: 12px; margin: 8px 0 0;">Expire dans 2 heures</p>
            </div>
            <div style="background: #FEF3C7; border-radius: 8px; padding: 12px; border: 1px solid #FCD34D;">
                <p style="color: #92400E; font-size: 13px; margin: 0;">
                    ⚠️ Transmettez ce lien directement à {prenom} {nom} par WhatsApp ou téléphone.
                </p>
            </div>
        </div>
        <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 1rem;">
            © 2026 Salama Data · Umande Investment Limited · Goma, RDC
        </p>
    </div>
    """
    return send_email(to_email, f"🔑 Reset mot de passe — {prenom} {nom}", html)
