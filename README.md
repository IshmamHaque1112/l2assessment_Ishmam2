# Customer Inbox Triage App

## Overview

The Customer Inbox Triage app is a lightweight AI-powered tool that helps classify customer support messages and recommend actions. It uses Groq AI to categorize messages, applies rule-based urgency scoring, and suggests next steps based on predefined templates.

## Problem Statement

Support teams waste time manually reading and triaging customer messages. This tool provides an automated first pass at classification to help prioritize and route messages more efficiently.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Groq API (Llama 3.3 70B - Free tier)
- **Runtime**: Browser-based (local development only)

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Groq API key (FREE - get from https://console.groq.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "L2 assessment"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Groq API Key**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Groq API key:
   ```
   VITE_GROQ_API_KEY=gsk_your-actual-key-here
   ```
   
   Get your FREE API key from: https://console.groq.com/keys
   
   **Why Groq?** Groq offers a generous free tier with fast inference and no credit card required!

4. **Run the application**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## How It Works

1. **Enter details**: the company receiving the message (saved for next time), the customer's name (optional), and the message.
2. **Keyword classification**: every category (built-in and custom) has a large keyword collection. Matching ignores case and punctuation and accepts plurals and -ed/-ing forms ("rat" matches "rats", "explode" matches "exploded").
3. **AI classification** (when a Groq key is set): Llama 3.3 70B picks from the same category list and returns JSON. It cannot invent categories, leave a message uncategorized when keywords clearly match, or outrank a safety category or lower urgency set by the keyword check. Without a key, the keyword result is used on its own.
4. **Urgency** (Critical / High / Medium / Low) comes from the category's minimum priority plus severity terms. It no longer uses punctuation, length, or time of day.
   - Health & Safety, Sanitation & Hygiene, and Product Safety Hazard start at **High**.
   - Terms like "can't breathe", "asthma attack", "exploded", "fire", or "hospital" make a message **Critical**.
5. **Emergency & safety contacts** are shown, and added to the reply, for critical messages and for health, sanitation, and product-safety reports (911, Poison Control, 988, CPSC, FDA, local health department, all editable).
6. **Suggested reply**: addressed to the customer, signed by the company, with a help link for the category and a FAQ link. Uncategorized messages get the FAQ link only.
7. **History & Dashboard**: all analyses are saved to localStorage.

## Categories

Built-in: Health & Safety · Sanitation & Hygiene · Product Safety Hazard · Product Defect / Damaged Item · Shipping & Delivery · Returns & Refunds · Billing & Payments · Account & Login · Technical Problem · Customer Service Complaint · Feature Request · Positive Feedback · General Inquiry.

On the **Settings** page a business can:
- set its company name, website (used to build placeholder help links), and FAQ link
- create **custom categories** with their own keywords, minimum priority, internal action, reply sentence, and help link
- add its own keywords to any built-in category and replace its placeholder link with a real one
- edit the emergency and safety contacts

## Example Test Messages

Try analyzing these messages to see how the triage system works:

### Example 1: Production Issue
```
Our production server is down
```

### Example 2: Customer Feedback
```
Hi there! I just wanted to say thank you for your amazing customer service. I've been using your product for three years now and I'm really happy with it. Keep up the great work!
```

### Example 3: Feature Request
```
I would love to see a dark mode option in the app. It would be much easier on my eyes during night time usage.
```

### Example 4: Payment Issue
```
I tried to update my payment method but the page keeps loading forever. Is this a known issue?
```

### Example 5: Billing Question
```
Can I upgrade my subscription to the pro plan?
```

### Example 6: Health & Safety (High, or Critical with an asthma attack)
```
I have asthma and had a reaction to peanuts in your granola bar even though the label didn't list them.
```

### Example 7: Sanitation (High)
```
I saw rats running around the produce aisle at your downtown store.
```

### Example 8: Product Safety (High, or Critical if it exploded)
```
The battery in the speaker I bought last week swelled up and now it's too hot to touch.
```

### Example 9: Technical Support
```
The dashboard won't load when I try to access it. I've tried refreshing but it keeps timing out.
```

## Security Note

⚠️ **Warning**: This application exposes the Groq API key in the browser (using `dangerouslyAllowBrowser: true`). This is acceptable for local development only but should **NEVER** be done in production. In a real application, API calls should be made from a secure backend server.

## Why Groq?

- ✅ **Completely Free** - No credit card required
- ✅ **Fast Inference** - Groq's LPU technology is incredibly fast
- ✅ **Generous Limits** - ~14,400 requests/day on free tier
- ✅ **High Quality** - Llama 3.3 70B performs excellently
- ✅ **Easy Signup** - Get started in minutes at https://console.groq.com

## License

This project is for educational purposes only.
