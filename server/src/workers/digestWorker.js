import cron from 'node-cron'
import { Resend } from 'resend'
import User from '../models/User.js'
import Item from '../models/Item.js'
import { getMistralClient } from '../services/aiService.js'

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

export const initDigestCron = () => {
  // Scheduled for Sunday at 9:00 AM ('0 9 * * 0')
  cron.schedule('0 9 * * 0', async () => {
    console.log("Running Weekly Digest Job...");
    try {
       const users = await User.find({});
       
       for (const user of users) {
          if (!user.email || user.email === 'unknown') continue;
          
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const recentItems = await Item.find({ userId: user._id, createdAt: { $gte: oneWeekAgo } })
          
          if (recentItems.length === 0) continue;
          
          // Synthesize weekly content
          let client;
          try { client = getMistralClient() } catch(e){}
          let aiSummary = "You've been saving some great content this week.";
          
          if (client) {
             const context = recentItems.map(i => i.title).join(", ")
             const prompt = `Write a short, engaging 2-sentence weekly digest intro for a user who saved these items to their Second Brain: ${context}`
             try {
               const res = await client.chat.complete({
                 model: 'mistral-large-latest',
                 messages: [{role: 'user', content: prompt}]
               })
               aiSummary = res.choices[0].message.content
             } catch (e) {
               console.error("AI Digest Synthesis failed, using fallback.")
             }
          }

          const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa; border-radius: 12px;">
              <h2 style="color: #2563eb;">Your Weekly NeuroVault Digest 🧠</h2>
              <p style="color: #4b5563; line-height: 1.6;">${aiSummary}</p>
              
              <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Memories Captured</h3>
              <ul style="list-style: none; padding: 0;">
                 ${recentItems.map(i => `
                   <li style="background: white; margin-bottom: 10px; padding: 12px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                     <strong style="color: #111827;">${i.title || "Untitled"}</strong> 
                     <span style="font-size: 12px; background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; margin-left: 8px; text-transform: uppercase;">${i.type}</span>
                   </li>
                 `).join('')}
              </ul>
              <p style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 30px;">Keep building your second brain!</p>
            </div>
          `

          // Dispatch Event (Requires valid domain in Resend. Standard mock fallback if empty)
          if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
              from: 'NeuroVault <digest@neurovault.io>', 
              to: [user.email],
              subject: 'Your Brain This Week',
              html: htmlContent
            });
            console.log(`Digest successfully mapped for ${user.email}`);
          } else {
             console.log(`Mock Digest processed for ${user.email}: Skipped dispatch because missing RESEND_API_KEY.`);
          }
       }
    } catch (e) {
       console.error("Weekly Digest Worker Error", e)
    }
  });
  console.log("Weekly Digest Cron Background Worker Initialized ⏱️");
}
