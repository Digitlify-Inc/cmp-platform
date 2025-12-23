# Widget Integration Guide

This guide provides detailed instructions for integrating the GSV Agent Chat Widget into your website or web application.

## Quick Start

Add the following code to your website before the closing `</body>` tag:

```html
<script src="https://api.gsv.ai/widget/gsv-widget.js"></script>
<script>
  GSVWidget.init({
    apiKey: 'your-api-key',
    agentId: 'your-agent-id'
  });
</script>
```

## Configuration Options

### Basic Configuration

```javascript
GSVWidget.init({
  // Required
  apiKey: 'your-api-key',      // Your API key from the portal
  agentId: 'your-agent-id',    // Agent ID from subscription

  // Optional - Appearance
  theme: 'light',              // 'light' or 'dark'
  position: 'bottom-right',    // 'bottom-right', 'bottom-left'
  primaryColor: '#007bff',     // Brand color (hex)

  // Optional - Behavior
  autoOpen: false,             // Open widget on page load
  welcomeMessage: 'Hi! How can I help?',
  placeholder: 'Type your message...',

  // Optional - Features
  enableVoice: true,           // Voice input/output
  enableAttachments: true,     // File/image attachments
  enableEmoji: true,           // Emoji picker
});
```

### Full Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | required | Your API key |
| `agentId` | string | required | Agent ID |
| `theme` | string | 'light' | 'light' or 'dark' |
| `position` | string | 'bottom-right' | Widget position |
| `primaryColor` | string | '#007bff' | Primary brand color |
| `secondaryColor` | string | '#6c757d' | Secondary color |
| `buttonSize` | number | 56 | Launcher button size (px) |
| `buttonIcon` | string | 'chat' | Icon: 'chat', 'message', 'support' |
| `autoOpen` | boolean | false | Auto-open on load |
| `autoOpenDelay` | number | 3000 | Delay before auto-open (ms) |
| `welcomeMessage` | string | null | Initial greeting message |
| `placeholder` | string | 'Type a message...' | Input placeholder |
| `enableVoice` | boolean | true | Enable voice features |
| `enableAttachments` | boolean | true | Allow file uploads |
| `enableEmoji` | boolean | true | Show emoji picker |
| `enableTypingIndicator` | boolean | true | Show typing animation |
| `enableSoundEffects` | boolean | false | Play notification sounds |
| `maxFileSize` | number | 10485760 | Max file size (bytes) |
| `allowedFileTypes` | array | ['image/*','application/pdf'] | Allowed MIME types |
| `sessionPersistence` | boolean | true | Persist chat across pages |
| `language` | string | 'en' | UI language code |
| `zIndex` | number | 999999 | CSS z-index |

## Appearance Customization

### Themes

```javascript
// Light theme (default)
GSVWidget.init({
  theme: 'light',
  // ...
});

// Dark theme
GSVWidget.init({
  theme: 'dark',
  // ...
});

// Custom colors
GSVWidget.init({
  theme: 'light',
  primaryColor: '#your-brand-color',
  secondaryColor: '#secondary-color',
  // ...
});
```

### Custom CSS

Override widget styles with CSS:

```css
/* Widget container */
#gsv-widget-container {
  font-family: 'Your Font', sans-serif;
}

/* Launcher button */
#gsv-widget-launcher {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Chat header */
.gsv-widget-header {
  background: linear-gradient(135deg, #your-color1, #your-color2);
}

/* Message bubbles */
.gsv-message-bot {
  background-color: #f0f0f0;
}

.gsv-message-user {
  background-color: #007bff;
}

/* Send button */
.gsv-send-button {
  background-color: #your-brand-color;
}
```

### Position Options

```javascript
// Bottom right (default)
position: 'bottom-right'

// Bottom left
position: 'bottom-left'

// Custom position with offset
GSVWidget.init({
  position: 'bottom-right',
  offsetX: 20,  // pixels from edge
  offsetY: 20,
});
```

## Voice Features

### Enable Voice Input

```javascript
GSVWidget.init({
  enableVoice: true,
  voiceLanguage: 'en-US',  // Speech recognition language
  // ...
});
```

### Voice Output (Text-to-Speech)

```javascript
GSVWidget.init({
  enableVoice: true,
  enableTTS: true,          // Text-to-speech for responses
  ttsVoice: 'en-US-Standard-A',
  // ...
});
```

## File Attachments

### Configuration

```javascript
GSVWidget.init({
  enableAttachments: true,
  maxFileSize: 10 * 1024 * 1024,  // 10MB
  allowedFileTypes: [
    'image/*',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  // ...
});
```

### Supported File Types

| Category | MIME Types |
|----------|------------|
| Images | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| Documents | `application/pdf`, `text/plain` |
| Office | `application/msword`, `application/vnd.ms-excel` |

## JavaScript API

### Methods

```javascript
// Open the widget
GSVWidget.open();

// Close the widget
GSVWidget.close();

// Toggle open/close
GSVWidget.toggle();

// Send a message programmatically
GSVWidget.sendMessage('Hello');

// Clear conversation
GSVWidget.clearConversation();

// Update configuration
GSVWidget.setConfig({
  theme: 'dark',
  primaryColor: '#ff0000'
});

// Get conversation history
const history = GSVWidget.getConversation();

// Destroy widget
GSVWidget.destroy();
```

### Events

```javascript
// Widget opened
GSVWidget.on('open', () => {
  console.log('Widget opened');
});

// Widget closed
GSVWidget.on('close', () => {
  console.log('Widget closed');
});

// Message sent
GSVWidget.on('messageSent', (message) => {
  console.log('User sent:', message);
});

// Response received
GSVWidget.on('messageReceived', (message) => {
  console.log('Agent response:', message);
});

// Conversation started
GSVWidget.on('conversationStart', (conversationId) => {
  console.log('New conversation:', conversationId);
});

// Conversation ended
GSVWidget.on('conversationEnd', (conversationId) => {
  console.log('Conversation ended:', conversationId);
});

// Error occurred
GSVWidget.on('error', (error) => {
  console.error('Widget error:', error);
});
```

## Multi-Language Support

```javascript
GSVWidget.init({
  language: 'es',  // Spanish
  translations: {
    sendButton: 'Enviar',
    placeholder: 'Escribe un mensaje...',
    welcomeMessage: 'Hola! Como puedo ayudarte?'
  },
  // ...
});
```

### Supported Languages

| Code | Language |
|------|----------|
| en | English |
| es | Spanish |
| fr | French |
| de | German |
| it | Italian |
| pt | Portuguese |
| ja | Japanese |
| zh | Chinese |
| ko | Korean |
| ar | Arabic |

## Session Management

### Persistence

```javascript
// Enable session persistence (default)
GSVWidget.init({
  sessionPersistence: true,
  sessionStorage: 'localStorage',  // or 'sessionStorage'
  // ...
});

// Custom session ID
GSVWidget.init({
  sessionId: 'user-123-session',
  // ...
});
```

### User Identification

```javascript
// Identify logged-in users
GSVWidget.identify({
  userId: 'user-123',
  email: 'user@example.com',
  name: 'John Doe',
  customData: {
    plan: 'premium',
    company: 'Acme Inc'
  }
});
```

## Analytics Integration

### Track Events

```javascript
GSVWidget.on('messageSent', (message) => {
  // Google Analytics
  gtag('event', 'chat_message_sent', {
    event_category: 'widget',
    event_label: 'user_message'
  });
});

GSVWidget.on('conversationEnd', (data) => {
  // Track completion
  gtag('event', 'chat_completed', {
    event_category: 'widget',
    event_label: data.conversationId
  });
});
```

## Security Best Practices

### API Key Security

```javascript
// Use a public/restricted API key for the widget
// Never expose your master API key in client-side code

GSVWidget.init({
  apiKey: 'pk_live_xxxx',  // Public key with limited permissions
  // ...
});
```

### Content Security Policy

Add to your CSP headers:

```
Content-Security-Policy:
  script-src 'self' https://api.gsv.ai;
  connect-src 'self' https://api.gsv.ai wss://api.gsv.ai;
  frame-src 'self' https://api.gsv.ai;
```

## Framework Integration

### React

```jsx
import { useEffect } from 'react';

function ChatWidget() {
  useEffect(() => {
    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://api.gsv.ai/widget/gsv-widget.js';
    script.onload = () => {
      window.GSVWidget.init({
        apiKey: process.env.REACT_APP_GSV_API_KEY,
        agentId: process.env.REACT_APP_AGENT_ID,
      });
    };
    document.body.appendChild(script);

    return () => {
      window.GSVWidget?.destroy();
      document.body.removeChild(script);
    };
  }, []);

  return null;
}

export default ChatWidget;
```

### Vue.js

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://api.gsv.ai/widget/gsv-widget.js';
  script.onload = () => {
    window.GSVWidget.init({
      apiKey: import.meta.env.VITE_GSV_API_KEY,
      agentId: import.meta.env.VITE_AGENT_ID,
    });
  };
  document.body.appendChild(script);
});

onUnmounted(() => {
  window.GSVWidget?.destroy();
});
</script>
```

### Next.js

```jsx
// components/ChatWidget.js
'use client';

import Script from 'next/script';

export default function ChatWidget() {
  return (
    <Script
      src="https://api.gsv.ai/widget/gsv-widget.js"
      strategy="lazyOnload"
      onLoad={() => {
        window.GSVWidget.init({
          apiKey: process.env.NEXT_PUBLIC_GSV_API_KEY,
          agentId: process.env.NEXT_PUBLIC_AGENT_ID,
        });
      }}
    />
  );
}
```

## Troubleshooting

### Widget Not Loading

1. Check browser console for errors
2. Verify API key is correct
3. Ensure script is loaded before `init()`
4. Check CSP headers allow the widget domain

### Connection Issues

1. Check network connectivity
2. Verify API endpoint is accessible
3. Check for firewall/proxy blocking

### Styling Conflicts

1. Increase widget z-index
2. Check for CSS resets affecting widget
3. Use more specific CSS selectors

### Performance

1. Load widget asynchronously
2. Use `autoOpen: false` on high-traffic pages
3. Implement lazy loading for mobile

## Support

- **Documentation**: https://docs.gsv.ai/widget
- **API Reference**: https://api.gsv.ai/docs
- **Support Email**: support@gsv.ai
- **GitHub Issues**: https://github.com/GSVDEV/gsv-widget/issues
