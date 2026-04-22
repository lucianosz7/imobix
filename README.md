# Imobix — Gestão de Imóveis e Renda 🏠

App mobile em **React Native + Expo** para gestão inteligente de imóveis e controle financeiro.

## 🚀 Como rodar

### Pré-requisitos

- Node.js 18+ instalado
- Expo CLI (`npm install -g expo-cli`) ou usar npx
- Expo Go no celular **ou** Android/iOS Emulator

### Instalação

```bash
cd imobix
npm install
```

### Iniciar o app

```bash
npx expo start
```

Depois escaneie o QR Code com o **Expo Go** (Android/iOS).

---

## 📱 Telas

| Tela | Rota | Descrição |
|------|------|-----------|
| Login | `/login` | Autenticação mock com validação |
| Dashboard | `/(tabs)` | Métricas financeiras, gráfico, imóveis recentes |
| Imóveis | `/(tabs)/properties` | Lista com filtros e status |
| Detalhe | `/property/[id]` | Receita, custos, lucro, histórico |
| Adicionar | `/(tabs)/add` | Formulário com preview de lucro |

## 🎨 Design

- **Cores**: `#0B1F3A` (Azul escuro), `#22C55E` (Verde), `#FFFFFF`
- **Estilo**: Fintech minimalista com glassmorphism sutil
- **Animações**: React Native Reanimated (fade + slide + scale)

## 🧱 Stack

- Expo ~54.0.0
- Expo Router ~6.0.23
- React Native ~0.81.5
- React Native Reanimated ~4.1.1
- TypeScript
- @expo/vector-icons

## 📁 Estrutura

```
imobix/
├── app/
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx            # Redirect → /login
│   ├── login.tsx            # Tela de login
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Tab bar
│   │   ├── index.tsx       # Dashboard
│   │   ├── properties.tsx  # Lista de imóveis
│   │   └── add.tsx         # Adicionar imóvel
│   └── property/[id].tsx   # Detalhe do imóvel
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── MetricCard.tsx
│   └── Header.tsx
├── constants/colors.ts
├── mocks/properties.ts
└── hooks/useAuth.ts
```

## 🔐 Credenciais de teste

Qualquer email válido + qualquer senha (mínimo 4 caracteres) realiza o login.
