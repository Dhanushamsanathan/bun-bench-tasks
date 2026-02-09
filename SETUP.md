# Open Router Setup Guide

This guide helps you configure the bun-bench-tasks project to use models from Open Router.

## Prerequisites

- [Bun](https://bun.sh) runtime installed
- An [Open Router](https://openrouter.ai) account and API key

## Installation Steps

### 1. Create Environment File

```bash
# Copy the template
cp .env.example .env
```

### 2. Add Your Open Router API Key

Edit `.env` and set your API key:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

You can find your API key at: https://openrouter.ai/keys

### 3. Verify Setup

Test that your environment is properly configured:

```bash
# Check if .env is loaded (Bun automatically loads it)
bun run -e "console.log(Bun.env.OPENROUTER_API_KEY ? '✓ API Key loaded' : '✗ API Key not found')"
```

## Claude API Compatibility Mode

If you want to use Claude models through Open Router with standard Anthropic API client libraries:

1. Edit `.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# For Claude API compatibility
ANTHROPIC_AUTH_TOKEN=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1
```

2. Use standard Anthropic client:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: Bun.env.ANTHROPIC_AUTH_TOKEN,
  baseURL: Bun.env.ANTHROPIC_BASE_URL,
});

const message = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your Open Router API key | `sk-or-v1-...` |
| `ANTHROPIC_AUTH_TOKEN` | For Anthropic API compatibility | `sk-or-v1-...` |
| `ANTHROPIC_BASE_URL` | API endpoint for Claude compatibility | `https://openrouter.ai/api/v1` |

## Using Open Router with Direct HTTP Calls

```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${Bun.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-4-turbo",
    messages: [
      { role: "user", content: "Hello!" }
    ],
  }),
});

const data = await response.json();
console.log(data);
```

## Available Models

Open Router provides access to many models. Popular options include:

- **Claude Models**: Anthropic's Claude 3 series
- **GPT Models**: OpenAI's GPT-4, GPT-3.5, etc.
- **Open Source**: Llama, Mistral, and other open-source models

See full list: https://openrouter.ai/models

## Troubleshooting

### API Key Not Loading

```bash
# Check if .env file exists
ls -la .env

# Verify Bun can read the environment
bun run -e "console.log(Bun.env)"
```

### Authentication Failed

- Ensure your API key is correct
- Check API key hasn't expired: https://openrouter.ai/keys
- Verify there's no extra whitespace in `.env`

### Rate Limiting

Open Router enforces rate limits. If you get rate-limit errors:
- Reduce request frequency
- Check usage dashboard: https://openrouter.ai/account/usage

## Security

⚠️ **Important**: Never commit `.env` file to git. The `.gitignore` should already exclude it.

```bash
# Verify .env is not tracked
git status

# If accidentally added:
git rm --cached .env
```

## Next Steps

- Review [CLAUDE.md](./CLAUDE.md) for project guidelines
- Start with simpler tasks: `cd tasks/task-001-content-length && bun test`
- Run all solutions: `bun run test:solutions`
