from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def interroger_agent(question: str, contexte_data: dict) -> str:
    prompt = f"""Tu es Salama Agent, un assistant IA specialise dans l'analyse
des donnees humanitaires en Republique Democratique du Congo.

Tu parles au coordinateur d'une agence humanitaire a Goma.
Reponds de maniere concise avec des recommandations concretes.

Donnees actuelles :
- Total beneficiaires : {contexte_data.get('total_beneficiaires', 0)}
- Zones actives : {contexte_data.get('zones', [])}
- Agents actifs : {contexte_data.get('nb_agents', 0)}
- Collectes ce mois : {contexte_data.get('collectes_mois', 0)}

Question : {question}

Reponds en francais avec des donnees precises et une recommandation actionnable."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500
    )
    return response.choices[0].message.content