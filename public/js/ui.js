// public/js/ui.js

const messagesContainer = document.getElementById('messagesContainer');
const connectionStatusEl = document.getElementById('connectionStatus');
const tokenStatusIndicator = document.getElementById('tokenStatusIndicator');
const toolCountEl = document.getElementById('toolCount');
const debugLogContent = document.getElementById('debug-log-content');

// Fonction pour logger les messages dans le panneau de débogage
export function addDebugLog(message, level = 'info') {
  if (!debugLogContent) return;
  const colors = {
    info: '#87cefa', // LightSkyBlue
    success: '#98fb98', // PaleGreen
    error: '#f08080', // LightCoral
    request: '#d8bfd8', // Thistle
  };
  const logEntry = document.createElement('div');
  const timestamp = new Date().toLocaleTimeString();
  logEntry.innerHTML = `[<span style="color: #666;">${timestamp}</span>] [<span style="color: ${colors[level] || '#fff'}">${level.toUpperCase()}</span>] ${escapeHtml(message)}`;
  debugLogContent.prepend(logEntry); // prepend pour voir les derniers logs en haut
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMessage(text) {
  const thoughtRegex = /<thought>([\s\S]*?)<\/thought>/g;
  const toolRegex = /<tool_code>([\s\S]*?)<\/tool_code>/g;

  let html = escapeHtml(text).replace(thoughtRegex, (match, thought) => {
    return `<div class="thought-bubble"><strong>Pensée :</strong> ${thought.trim()}</div>`;
  });

  html = html.replace(toolRegex, (match, toolCode) => {
    try {
      const tool = JSON.parse(toolCode);
      return `<div class="tool-call"><strong>Outil : ${escapeHtml(
        tool.tool,
      )}</strong><pre>${escapeHtml(
        JSON.stringify(tool.parameters, null, 2),
      )}</pre></div>`;
    } catch (e) {
      return `<div class="tool-call"><strong>Outil mal formé</strong><pre>${escapeHtml(
        toolCode,
      )}</pre></div>`;
    }
  });

  return html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function getAvatar(sender) {
  switch (sender) {
    case 'user':
      return '👤';
    case 'assistant':
      return '🤖';
    case 'client':
      return '📎';
    default:
      return '❔';
  }
}

export function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  const rawText = text;
  messageDiv.innerHTML = `
        <div class="message-avatar">${getAvatar(sender)}</div>
        <div class="message-content">
            <div class="message-text">${formatMessage(rawText)}</div>
        </div>`;
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
  return messageDiv;
}

export function updateUserMessage(element, newText, newSender) {
  hideTypingIndicator();
  element.className = `message ${newSender}`;
  const avatarElement = element.querySelector('.message-avatar');
  if (avatarElement) {
    avatarElement.innerHTML = getAvatar(newSender);
  }
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

export function updateToolCount(count) {
  if (toolCountEl) {
    toolCountEl.textContent = count;
  }
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
