// public/js/ui.js (version mise à jour)

const messagesContainer = document.getElementById('messagesContainer');
const connectionStatusEl = document.getElementById('connectionStatus');
const tokenStatusIndicator = document.getElementById('tokenStatusIndicator');

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMessage(text) {
  const thoughtRegex = /<thought>([\s\S]*?)<\/thought>/g;
  const toolRegex = /<tool_code>([\s\S]*?)<\/tool_code>/g;

  let html = text.replace(thoughtRegex, (match, thought) => {
    return `<div class="thought-bubble"><strong>Pensée :</strong> ${escapeHtml(thought.trim())}</div>`;
  });

  html = html.replace(toolRegex, (match, toolCode) => {
    try {
      const tool = JSON.parse(toolCode);
      return `<div class="tool-call"><strong>Outil : ${tool.tool}</strong><pre>${escapeHtml(JSON.stringify(tool.parameters, null, 2))}</pre></div>`;
    } catch (e) {
      return `<div class="tool-call"><strong>Outil mal formé</strong></div>`;
    }
  });

  return html
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
  return messageDiv;
}

export function updateUserMessage(element, newText, newSender) {
  hideTypingIndicator();
  element.className = `message ${newSender}`;
  const textElement = element.querySelector('.message-text');
  if (textElement) {
    textElement.innerHTML = formatMessage(newText);
  }
}

export function showTypingIndicator() {
  hideTypingIndicator();
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

export function updateTokenStatus(isSet) {
  if (isSet) {
    connectionStatusEl.textContent = 'Token Prêt';
    tokenStatusIndicator.classList.add('valid');
  } else {
    connectionStatusEl.textContent = 'Token Requis';
    tokenStatusIndicator.classList.remove('valid');
  }
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
