# envault

> A developer utility for encrypting and syncing `.env` files across team members using asymmetric keys.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

**Initialize envault in your project:**

```bash
envault init
```

This generates a key pair and creates an `envault.config.json` in your project root.

**Encrypt your `.env` file:**

```bash
envault encrypt --input .env --output .env.vault
```

**Decrypt on another machine:**

```bash
envault decrypt --input .env.vault --output .env --key ./private.key
```

**Share encrypted secrets with your team by committing `.env.vault` to version control — never commit `.env` or your private key.**

Add to your `.gitignore`:

```
.env
*.key
```

---

## How It Works

1. `envault init` generates an RSA key pair for your project.
2. `envault encrypt` encrypts your `.env` file using the public key.
3. Team members with the private key can run `envault decrypt` to restore the original file.

---

## License

[MIT](./LICENSE)