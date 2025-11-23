// Client-side chat widget using Socket.IO
import { getAuthToken, getCurrentUser } from './js/auth.js';

// Configuration
const SOCKET_URL = window.location.origin;

// State
let socket = null;
let currentShopId = null; // Seller ID
let currentProductName = null;
let currentUser = getCurrentUser();
let isOpen = false;

// Initialize Socket.IO
function initSocket() {
    if (socket) return;

    const token = getAuthToken();
    if (!token) return; // Wait for auth

    // Load Socket.IO client script dynamically if not present
    if (!window.io) {
        const script = document.createElement('script');
        script.src = '/socket.io/socket.io.js';
        script.onload = () => connectSocket();
        document.head.appendChild(script);
    } else {
        connectSocket();
    }
}

function connectSocket() {
    const token = getAuthToken();
    socket = io(SOCKET_URL, {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('Chat widget connected');
    });

    socket.on('new-message', (msg) => {
        // Only show if widget is open and chatting with this person
        if (isOpen && (msg.sender === currentShopId || msg.receiver === currentShopId)) {
            appendMessage(msg);
            scrollToBottom();
        }
    });
}

// Build Widget UI
function buildWidget() {
    const root = document.getElementById('chat-root');
    if (!root) return;

    root.innerHTML = `
    <div id="chat-widget" class="chat-container" style="display:none">
      <div class="chat-header">
        <div id="chatTitle">Chat with Seller</div>
        <div>
          <button id="closeBtn" style="background:transparent;border:0;color:#fff;cursor:pointer;font-size:1.2rem">✕</button>
        </div>
      </div>
      <div class="chat-body">
        <div id="messages" class="messages"></div>
      </div>
      <form id="chatForm" class="chat-form" autocomplete="off">
        <input id="msgInput" class="message" type="text" placeholder="Type a message..." maxlength="1000" />
        <button type="submit">Send</button>
      </form>
    </div>
  `;

    // Event Listeners
    document.getElementById('closeBtn').addEventListener('click', closeChat);
    document.getElementById('chatForm').addEventListener('submit', sendMessage);
}

// Open Chat
window.openChatWidget = async function (sellerId, productName, userName) {
    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    if (!socket) initSocket();

    currentShopId = sellerId;
    currentProductName = productName;
    isOpen = true;

    const widget = document.getElementById('chat-widget');
    if (!widget) buildWidget();

    document.getElementById('chat-widget').style.display = 'flex';
    document.getElementById('chatTitle').textContent = `Chat about ${productName}`;
    document.getElementById('messages').innerHTML = '<div style="text-align:center;padding:10px;color:#888">Loading history...</div>';

    // Load history
    try {
        const response = await fetch(`/api/chat/messages/${sellerId}?limit=50`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const data = await response.json();

        if (data.success) {
            renderMessages(data.messages);

            // If no messages, add initial greeting
            if (data.messages.length === 0) {
                document.getElementById('msgInput').value = `Hi, is "${productName}" available?`;
            }
        }
    } catch (e) {
        console.error('Error loading chat:', e);
    }
};

function closeChat() {
    document.getElementById('chat-widget').style.display = 'none';
    isOpen = false;
}

function renderMessages(messages) {
    const container = document.getElementById('messages');
    container.innerHTML = '';
    messages.forEach(appendMessage);
    scrollToBottom();
}

function appendMessage(msg) {
    const container = document.getElementById('messages');
    const isMe = msg.sender === currentUser.id;

    const div = document.createElement('div');
    div.className = `msg ${isMe ? 'client' : 'seller'}`;
    div.innerHTML = `
    <div class="meta">${isMe ? 'You' : 'Seller'} • ${new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    <div class="body">${escapeHtml(msg.message)}</div>
  `;

    container.appendChild(div);
}

async function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('msgInput');
    const text = input.value.trim();

    if (!text || !socket) return;

    // Emit
    socket.emit('send-message', {
        receiverId: currentShopId,
        message: text
    });

    // Optimistic append
    appendMessage({
        sender: currentUser.id,
        message: text,
        timestamp: new Date()
    });

    scrollToBottom();
    input.value = '';
}

function scrollToBottom() {
    const el = document.getElementById('messages');
    el.scrollTop = el.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Init
if (currentUser) {
    buildWidget();
    initSocket();
}
