import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
APP_URL = os.getenv("APP_URL", "http://localhost:5173")
SUPER_ADMIN_EMAIL = os.getenv("SUPER_ADMIN_EMAIL", "shadmwab@gmail.com")

def send_welcome_agent(to_email: str, prenom: str, nom: str, role: str, password: str, org_name: str):
    role_labels = {"admin": "Administrateur", "manager": "Manager", "agent": "Agent terrain"}
    role_label = role_labels.get(role, role)
    try:
        resend.Emails.send({
            "from": "Salama Data <onboarding@resend.dev>",
            "to": to_email,
            "subject": f"Bienvenue sur Salama Data — Vos identifiants de connexion",
            "html": f"""
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
                            <tr>
                                <td style="color: #64748B; padding: 4px 0;">Email</td>
                                <td style="color: #0D2E4E; font-weight: 600;">{to_email}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748B; padding: 4px 0;">Mot de passe</td>
                                <td style="color: #0D2E4E; font-weight: 600;">{password}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748B; padding: 4px 0;">Rôle</td>
                                <td style="color: #0D2E4E; font-weight: 600;">{role_label}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748B; padding: 4px 0;">Organisation</td>
                                <td style="color: #0D2E4E; font-weight: 600;">{org_name}</td>
                            </tr>
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
                    © 2026 Salama Data · Développé par Shadrack N'Sapu Mwabilwa · Goma, RDC
                </p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_org_request_notification(org_name: str, contact_name: str, email: str, phone: str, message: str):
    try:
        resend.Emails.send({
            "from": "Salama Data <onboarding@resend.dev>",
            "to": SUPER_ADMIN_EMAIL,
            "subject": f"Nouvelle demande d'organisation — {org_name}",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f8; padding: 2rem;">
                <div style="background: #0D2E4E; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
                    <h1 style="color: white; font-size: 24px; margin: 0;">SALAMA DATA</h1>
                    <p style="color: #7FB3D3; margin: 4px 0 0;">Nouvelle demande d'organisation</p>
                </div>
                <div style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid #DDE3EC;">
                    <h2 style="color: #A32D2D; font-size: 18px;">🔔 Nouvelle organisation souhaite rejoindre</h2>
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
                    <p style="color: #64748B; font-size: 13px;">Connectez-vous au panneau admin pour approuver cette demande.</p>
                </div>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_org_approved(to_email: str, org_name: str, contact_name: str, admin_password: str):
    try:
        resend.Emails.send({
            "from": "Salama Data <onboarding@resend.dev>",
            "to": to_email,
            "subject": f"Votre organisation {org_name} a été approuvée — Salama Data",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f8; padding: 2rem;">
                <div style="background: #0D2E4E; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
                    <h1 style="color: white; font-size: 24px; margin: 0;">SALAMA DATA</h1>
                    <p style="color: #7FB3D3; margin: 4px 0 0;">Demande approuvée</p>
                </div>
                <div style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid #DDE3EC;">
                    <h2 style="color: #085041;">✓ Votre organisation a été approuvée !</h2>
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
        })
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False