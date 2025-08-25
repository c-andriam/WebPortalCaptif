import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { User, Key, Shield } from 'lucide-react'

export function DemoCredentials() {
  const credentials = [
    {
      role: 'SUPERADMIN',
      email: 'superadmin@captivenet.com',
      password: 'SuperAdmin123!',
      description: 'Accès complet au système',
      color: 'destructive' as const
    },
    {
      role: 'ADMIN',
      email: 'admin@captivenet.com',
      password: 'AdminPassword123!',
      description: 'Gestion des utilisateurs et vouchers',
      color: 'warning' as const
    },
    {
      role: 'SUBSCRIBER',
      email: 'user@example.com',
      password: 'UserPassword123!',
      description: 'Compte abonné standard',
      color: 'success' as const
    }
  ]

  const voucherCodes = ['DEMO1234', 'TEST5678', 'GUEST999', 'INVITE01']

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" />
            Comptes de Démonstration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {credentials.map((cred) => (
              <div key={cred.role} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={cred.color}>{cred.role}</Badge>
                  <span className="text-xs text-gray-400">{cred.description}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-16">Email:</span>
                    <code className="text-blue-300 bg-gray-900 px-2 py-1 rounded">{cred.email}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-16">Mot de passe:</span>
                    <code className="text-green-300 bg-gray-900 px-2 py-1 rounded">{cred.password}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-yellow-400" />
            Codes Invités de Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {voucherCodes.map((code) => (
              <div key={code} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-center">
                <code className="text-yellow-300 font-mono text-lg">{code}</code>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Ces codes permettent un accès invité temporaire avec quotas limités
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Fonctionnalités par Rôle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <Badge variant="destructive" className="mb-2">SUPERADMIN</Badge>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• Configuration système complète</li>
                <li>• Gestion des administrateurs</li>
                <li>• Accès aux logs d'audit</li>
                <li>• Paramètres de sécurité avancés</li>
              </ul>
            </div>
            <div>
              <Badge variant="warning" className="mb-2">ADMIN</Badge>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• Validation des comptes abonnés</li>
                <li>• Création de codes invités</li>
                <li>• Gestion des sessions actives</li>
                <li>• Surveillance du réseau</li>
              </ul>
            </div>
            <div>
              <Badge variant="success" className="mb-2">SUBSCRIBER</Badge>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• Gestion des appareils personnels</li>
                <li>• Consultation des quotas</li>
                <li>• Historique de connexion</li>
                <li>• Paramètres du profil</li>
              </ul>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">GUEST</Badge>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• Accès temporaire limité</li>
                <li>• Consultation des quotas restants</li>
                <li>• Informations de session</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}