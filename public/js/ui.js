// public/js/ui.js

const messagesContainer = document.getElementById('messagesContainer');
const connectionStatusEl = document.getElementById('connectionStatus');
const statusIndicator = document.querySelector('.status-indicator');

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMessage(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

export function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.innerHTML = `
        <div class="message-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-text">${formatMessage(text)}</div>
        </div>`;
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

export function showTypingIndicator() {
  hideTypingIndicator(); // Assure qu'il n'y en a pas déjà un
  const indicator = document.createElement('div');
  indicator.id = 'typingIndicator';
  indicator.className = 'message assistant';
  indicator.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
        </div>`;
  messagesContainer.appendChild(indicator);
  scrollToBottom();
}

export function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

export function setStatus(isConnected) {
  if (isConnected) {
    connectionStatusEl.textContent = 'Connected';
    statusIndicator.style.background = 'var(--accent-primary)';
  } else {
    connectionStatusEl.textContent = 'Disconnected';
    statusIndicator.style.background = 'var(--accent-danger)';
  }
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
