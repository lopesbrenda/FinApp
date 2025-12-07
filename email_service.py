"""
Email Service using Resend.com v2 (3k/month FREE)
Handles financial alerts with professional templates
"""
import resend
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

# Resend v2: client direto (sem Resend())
resend.api_key = os.getenv("RESEND_API_KEY")

class EmailService:
    @staticmethod
    def goal_completion_alert(user_email, goal_name, progress_pct):
        """Alert when goal reaches 90% completion"""
        return resend.Emails.send({
            "from": "FinLife <noreply@finlife.app>",
            "to": user_email,
            "subject": f"🎉 {goal_name} - {progress_pct}% concluído!",
            "html": f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6c21e4;">🎉 Excelente progresso!</h1>
                <p><strong>{goal_name}</strong> atingiu <strong>{progress_pct}%</strong> do objetivo!</p>
                <div style="background: linear-gradient(90deg, #6c21e4 {progress_pct}%, #e0e0e0 {progress_pct}%); 
                            height: 20px; border-radius: 10px; margin: 20px 0;">
                </div>
                <p>Continue assim! 🚀</p>
                <hr style="border: none; border-top: 1px solid #eee;">
                <small style="color: #666;">FinLife - Seu controle financeiro | {datetime.now().strftime('%d/%m/%Y')}</small>
            </div>
            """
        })

    @staticmethod
    def expense_limit_alert(user_email, category, spent, limit):
        """Alert when expense exceeds 80% of budget"""
        pct = (spent / limit) * 100
        return resend.Emails.send({
            "from": "FinLife <noreply@finlife.app>",
            "to": user_email,
            "subject": f"⚠️ {category}: {pct:.0f}% do orçamento usado",
            "html": f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ff6b6b;">⚠️ Atenção no orçamento!</h1>
                <p><strong>{category}</strong>: R$ {spent:.2f} / R$ {limit:.2f}</p>
                <div style="background: linear-gradient(90deg, #ff6b6b {pct}%, #e0e0e0 {pct}%); 
                            height: 20px; border-radius: 10px; margin: 20px 0;">
                </div>
                <p>Você usou <strong>{pct:.0f}%</strong> do orçamento mensal.</p>
                <hr style="border: none; border-top: 1px solid #eee;">
                <small style="color: #666;">FinLife - Seu controle financeiro | {datetime.now().strftime('%d/%m/%Y')}</small>
            </div>
            """
        })
