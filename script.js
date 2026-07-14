const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// 🧠 FRONTEND CHAT MEMORY:
// Har baar jab user aur AI baat karenge, hum isi array mein data jodenge aur backend ko bhejenge.
// Isse Vercel par 'dukan band hone' wala crash kabhi nahi aayega!
let localChatHistory = [
    {
        role: "system",
        content: "You are a helpful, friendly AI assistant. Always remember the context of the conversation and refer to previous messages when appropriate."
    }
];

// Initial Page Load Animation
window.addEventListener('DOMContentLoaded', () => {
    gsap.from('.chat-container', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
    });
    
    // First AI welcome message pop-in
    gsap.to('.ai-message', { opacity: 1, duration: 0.5, delay: 0.5 });
});

// Message screen par display karne ka function with GSAP
function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.innerText = text;

    messageDiv.appendChild(bubble);
    chatBox.appendChild(messageDiv);

    // GSAP Pop Animation for new message
    gsap.fromTo(messageDiv, 
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.2)' }
    );

    // Auto scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return messageDiv; 
}

// API Connection Function (Cleaned & Corrected)
async function getAIResponse(userMessage) {
    const myApiUrl = "https://xyz-ai-backend.vercel.app/xyz-api/chat"; 
    
    // 1. Pehle user ka message local memory mein push karo
    localChatHistory.push({ role: "user", content: userMessage });

    // Memory limit handle karo (Pichle 15 messages)
    if (localChatHistory.length > 15) {
        localChatHistory.splice(1, 2); 
    }

    try {
        const response = await fetch(myApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                message: userMessage,
                history: localChatHistory // Poori memory backend ko pass kar rahe hain safely!
            })
        });
        
        const data = await response.json();
        
        if (data.reply) {
            // 2. AI ka response bhi local memory mein push karo taaki agli baar yaad rahe
            localChatHistory.push({ role: "assistant", content: data.reply });
            return data.reply;
        } else {
            return "Server se sahi response nahi aaya bhai.";
        }
    } catch (error) {
        console.error("Frontend error:", error);
        return "Backend se connection nahi ho paa raha hai bhai. Ek baar Vercel aur keys check karo.";
    }
}

// Main logic handle send
async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. User message insert karo
    appendMessage('user', text);
    userInput.value = '';

    // 2. Typing loader create karo
    const loaderDiv = appendMessage('ai', 'Thinking...');
    
    // Response fetch karo
    const aiResponse = await getAIResponse(text);
    
    // 3. Loader hatane ke liye fade out karke change karo
    gsap.to(loaderDiv, { 
        opacity: 0, 
        duration: 0.2, 
        onComplete: () => {
            loaderDiv.remove();
            // Asli answer print karo
            appendMessage('ai', aiResponse);
        }
    });
}

// Trigger Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});