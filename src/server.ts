/**
 * Fichier : src/server.ts
 * Rôle : Définit la logique de l'application Express : middlewares, routeurs, et routes.
 * Statut : Corrigé, complet, typé et formaté.
 */

// Correction: Importation des valeurs et des types séparément
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import morgan from 'morgan';

// --- APPLICATION EXPRESS ---
export const app = express();

// --- MIDDLEWARES GLOBAUX ---
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// --- BASE DE DONNÉES SIMULÉE ET LOGIQUE MÉTIER ---
const users = [
  {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash:
      '$2b$10$wGrwV2.dG2L7salsjN7DkOfGzSITOfGrq6XcgqdY2CV2FvEaNEZ7G', // "password123"
    memberSince: new Date(),
  },
];
const activeSessions = new Map<string, { userId: string }>();

const db = {
  users: {
    findByEmail: async (email: string) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return users.find((u) => u.email === email);
    },
    findById: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return users.find((u) => u.id === id);
    },
  },
};

// --- MIDDLEWARE D'AUTHENTIFICATION ---
// Correction: Désactivation de la règle ESLint pour ce cas d'usage légitime

declare global {
  namespace Express {
    export interface Request {
      user?: { id: string; email: string; memberSince: Date };
    }
  }
}

const sessionAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const headerNameToFind = 'x-session-id';
  const actualHeaderKey = Object.keys(req.headers).find(
    (key) => key.toLowerCase() === headerNameToFind,
  );
  const sessionId = actualHeaderKey
    ? (req.headers[actualHeaderKey] as string)
    : undefined;

  if (!sessionId) {
    return res.status(401).json({
      error: "Authentification requise: l'en-tête de session est manquant.",
    });
  }
  const session = activeSessions.get(sessionId);
  if (!session) {
    return res.status(401).json({
      error: 'Session invalide ou expirée. Veuillez vous reconnecter.',
    });
  }
  const user = await db.users.findById(session.userId);
  if (!user) {
    return res
      .status(401)
      .json({ error: 'Utilisateur associé à la session introuvable.' });
  }
  req.user = { id: user.id, email: user.email, memberSince: user.memberSince };
  next();
};

// --- DÉFINITION DES ROUTEURS ---
const authRouter = express.Router();
const apiRouter = express.Router();

// --- ROUTES D'AUTHENTIFICATION ---
// Correction: Ajout des types pour les paramètres req, res, next
authRouter.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: 'Email et mot de passe sont requis.' });
      }
      const user = await db.users.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides.' });
      }
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Identifiants invalides.' });
      }
      const sessionId = uuidv4();
      activeSessions.set(sessionId, { userId: user.id });
      console.log(
        `Nouvelle session créée: ${sessionId} pour l'utilisateur ${user.id}`,
      );
      res.status(200).json({ message: 'Connexion réussie', sessionId });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post('/logout', (req: Request, res: Response) => {
  const headerNameToFind = 'x-session-id';
  const actualHeaderKey = Object.keys(req.headers).find(
    (key) => key.toLowerCase() === headerNameToFind,
  );
  const sessionId = actualHeaderKey
    ? (req.headers[actualHeaderKey] as string)
    : undefined;

  if (sessionId && activeSessions.has(sessionId)) {
    activeSessions.delete(sessionId);
    console.log(`Session terminée: ${sessionId}`);
  }
  res.status(200).json({ message: 'Déconnexion réussie.' });
});

// --- ROUTES API PROTÉGÉES ---
apiRouter.get('/profile', (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
});

app.use('/api', authRouter);
app.use('/api/data', sessionAuthMiddleware, apiRouter);

// --- GESTIONNAIRE D'ERREURS GLOBAL ---
// Correction: Ajout du préfixe "_" pour la variable non utilisée "next"
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ ERREUR GLOBALE NON GERÉE:', error);
  res
    .status(500)
    .json({ error: 'Une erreur interne est survenue sur le serveur.' });
});
