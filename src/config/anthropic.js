/**
 * Anthropic API config
 * Reads from env var, falls back to hardcoded key.
 * Replace 'YOUR_ANTHROPIC_API_KEY' with your real key from console.anthropic.com
 */
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || 'YOUR_ANTHROPIC_API_KEY';

export default ANTHROPIC_API_KEY;
