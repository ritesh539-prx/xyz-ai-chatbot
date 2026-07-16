// Pure script ko safely DOMContentLoaded ke andar daal diya hai taaki koi element missing na mile
window.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    // Check agar saare elements sahi se load hue hain
    if (!chatBox || !userInput || !sendBtn) {
        console.error("❌ ERROR: HTML elements (chatBox, userInput, ya sendBtn) missing hain!");
        return;
    }

    // 🧠 FRONTEND CHAT MEMORY
    let localChatHistory = [
        {
            role: "system",
            content: "You are a helpful, friendly AI assistant. Always remember the context of the conversation and refer to previous messages when appropriate."
        }
    ];

    // Initial Page Load Animation Safely
    if (typeof gsap !== 'undefined') {
        gsap.from('.chat-container', {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out'
        });
        gsap.to('.ai-message', { opacity: 1, duration: 0.5, delay: 0.5 });
    } else {
        console.log("⚠️ GSAP dynamic layer missing, normal load active.");
    }

    // Message screen par display karne ka function
    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.innerText = text;

        messageDiv.appendChild(bubble);
        chatBox.appendChild(messageDiv);

        // GSAP Pop Animation for new message safely
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(messageDiv, 
                { opacity: 0, y: 15, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.2)' }
            );
        } else {
            messageDiv.style.opacity = "1";
        }

        // Auto scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
        
        return messageDiv; 
    }

    // API Connection Function
    async function getAIResponse(userMessage) {
        const myApiUrl = "https://xyz-ai-backend.vercel.app/xyz-api/chat"; 
        
        // 1. User message pushed to history
        localChatHistory.push({ role: "user", content: userMessage });

        // Memory window dynamic scale setup
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
                    history: localChatHistory
                })
            });
            
            const data = await response.json();
            
            if (data.reply) {
                localChatHistory.push({ role: "assistant", content: data.reply });
                return data.reply;
            } else {
                return "Server se sahi response nahi aaya bhai.";
            }
        } catch (error) {
            console.error("Frontend HTTP connection failure:", error);
            return "Backend se connection nahi ho paa raha hai bhai. Ek baar Vercel dashboard par logs aur keys check karo.";
        }
    }

    // Main logic handle send
    async function handleSend() {
        try {
            const text = userInput.value.trim();
            if (!text) return;

            // 1. User ka message instant screen par dikhao
            appendMessage('user', text);
            userInput.value = '';

            // 2. Typing loader animation set
            const loaderDiv = appendMessage('ai', 'Thinking...');
            const bubbleElement = loaderDiv.querySelector('.bubble');
            
            if (typeof gsap !== 'undefined' && bubbleElement) {
                gsap.to(bubbleElement, { opacity: 0.5, yoyo: true, repeat: -1, duration: 0.5 });
            }
            
            // API Response load trigger
            const aiResponse = await getAIResponse(text);
            
            // 3. Update loading element state dynamically
            if (typeof gsap !== 'undefined' && bubbleElement) {
                gsap.killTweensOf(bubbleElement);
                
                gsap.to(loaderDiv, { 
                    opacity: 0, 
                    y: 10,
                    duration: 0.15, 
                    onComplete: () => {
                        bubbleElement.innerText = aiResponse;
                        
                        gsap.to(loaderDiv, {
                            opacity: 1,
                            y: 0,
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }
                });
            } else if (bubbleElement) {
                // Fallback process without GSAP engines
                bubbleElement.innerText = aiResponse;
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        } catch (err) {
            console.error("Crash inside execution core handling:", err);
        }
    }

    // Trigger Listeners wrapper boundation
    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});