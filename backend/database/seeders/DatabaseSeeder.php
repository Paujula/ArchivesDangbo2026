<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Direction;
use App\Models\Document;
use App\Models\SerieArchive;
use App\Models\Service;
use App\Models\SousSerie;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // ── Services ──────────────────────────────────────────────────────────
        foreach (['Cabinet du Maire', 'Secrétariat Général', 'Affaires Sociales', 'État Civil', 'Finances', 'Technique'] as $name) {
            Service::firstOrCreate(['name' => $name]);
        }

        // ── Directions ─────────────────────────────────────────────────────────
        foreach (['Administration Générale', 'Affaires Sociales et Culturelles', 'Développement et Urbanisme'] as $name) {
            Direction::firstOrCreate(['nom_direction' => $name]);
        }

        // ── Séries d'archives (12 grandes catégories A-L) ──────────────────────
        SerieArchive::query()->delete();
        SousSerie::query()->delete();

        $seriesList = [
            'A' => 'Administration générale et pilotage stratégique',
            'B' => 'Audit',
            'C' => 'Marchés publics',
            'D' => 'Finances et Comptabilité',
            'E' => 'Gestion des Ressources humaines',
            'F' => 'Information et Communication',
            'G' => 'État-civil et Population',
            'H' => 'Ordre public',
            'I' => 'Aménagement Urbain et Foncier',
            'J' => 'Politiques environnementales',
            'K' => 'Développement local',
            'L' => 'Coopération décentralisée et intercommunalité',
        ];

        $serieMap = [];
        foreach ($seriesList as $c => $nom) {
            $s = SerieArchive::create(['nom_serie' => $nom]);
            $serieMap[$c] = $s->id;
        }

        // ── Sous-séries ────────────────────────────────────────────────────────
        $sousSeries = [
            ['1A — Gestion administrative et réglementaire', 'A'],
            ['2A — Cadre réglementaire et contentieux', 'A'],
            ['1B — Audit', 'B'],
            ['2B — Contrôle général', 'B'],
            ['1C — Planification des marchés publics', 'C'],
            ['2C — Passation et exécution des marchés', 'C'],
            ['3C — Contrôle des marchés publics', 'C'],
            ['4C — Contentieux contractuel', 'C'],
            ['5C — Dossiers d\'agrément', 'C'],
            ['1D — Budget', 'D'],
            ['2D — Financement', 'D'],
            ['3D — Comptabilité', 'D'],
            ['4D — Gestion de la paie', 'D'],
            ['5D — Gestion des ressources mobilières et immobilières', 'D'],
            ['6D — Gestion des équipements marchands', 'D'],
            ['7D — Gestion financière du Registre Foncier Urbain', 'D'],
            ['1E — Gestion des emplois et des effectifs', 'E'],
            ['2E — Recrutement et dotation du personnel', 'E'],
            ['3E — Administration du personnel', 'E'],
            ['4E — Gestion du temps de travail', 'E'],
            ['5E — Évaluation, promotion et mouvement du personnel', 'E'],
            ['6E — Développement des personnes et de l\'organisation', 'E'],
            ['7E — Administration des traitements et des bénéfices', 'E'],
            ['8E — Relations sociales', 'E'],
            ['9E — Santé et sécurité au travail', 'E'],
            ['1F — Informatique et télécommunications', 'F'],
            ['2F — Gestion des archives', 'F'],
            ['3F — Communication et relations médias', 'F'],
            ['4F — Cérémonies officielles et événements spéciaux', 'F'],
            ['5F — Productions et publications', 'F'],
            ['1G — Enregistrement des faits d\'état civil', 'G'],
            ['2G — Gestion de la population', 'G'],
            ['3G — Titres d\'identité', 'G'],
            ['4G — Relations institutionnelles et contentieux', 'G'],
            ['5G — Élections', 'G'],
            ['1H — Déclarations administratives', 'H'],
            ['2H — Cultes', 'H'],
            ['1I — Planification urbaine', 'I'],
            ['2I — Permis de construire', 'I'],
            ['3I — Habitat et logement', 'I'],
            ['4I — Expropriation', 'I'],
            ['5I — Voirie et réseaux', 'I'],
            ['6I — Espaces publics et mobilier urbain', 'I'],
            ['7I — Gestion foncière et du cadastre', 'I'],
            ['8I — Gestion du registre foncier urbain', 'I'],
            ['1J — Protection de l\'environnement', 'J'],
            ['2J — Hygiène publique et assainissement', 'J'],
            ['3J — Gestion des risques environnementaux et sanitaires', 'J'],
            ['4J — Gestion des inhumations et du cimetière', 'J'],
            ['1K — Action sociale', 'K'],
            ['2K — Éducation, jeunesse, sports et loisirs', 'K'],
            ['3K — Culture, patrimoine et tourisme', 'K'],
            ['1L — Coopération décentralisée', 'L'],
            ['2L — Intercommunalité et relations institutionnelles', 'L'],
        ];

        foreach ($sousSeries as $ss) {
            SousSerie::create([
                'libelle_sous_serie' => $ss[0],
                'id_serie' => $serieMap[$ss[1]],
            ]);
        }

        // ── Utilisateurs ──────────────────────────────────────────────────────
        $users = [
            [
                'name' => 'Maoudo Djossou',
                'email' => 'maoudo.djossou@dangbo.bj',
                'password' => bcrypt('Dangbo2026'),
                'role' => 'admin',
                'service' => 'Cabinet du Maire',
                'initials' => 'MD',
                'color' => '#0c6e4a',
                'rights' => '[]',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Rachelle Akplogan',
                'email' => 'rachelle.akplogan@dangbo.bj',
                'password' => bcrypt('Dangbo2026'),
                'role' => 'archiviste',
                'service' => 'Secrétariat Général',
                'initials' => 'RA',
                'color' => '#c98a16',
                'rights' => '[]',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Ange Tossou',
                'email' => 'a.tossou@dangbo.bj',
                'password' => bcrypt('Dangbo2026'),
                'role' => 'agent',
                'service' => 'Affaires Sociales',
                'initials' => 'AT',
                'color' => '#3c5d76',
                'rights' => '[]',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $user) {
            User::firstOrCreate(['email' => $user['email']], $user);
        }

        // ── Documents ──────────────────────────────────────────────────────────
        $serieA = SerieArchive::where('nom_serie', 'Administration générale et pilotage stratégique')->first();
        $serieG = SerieArchive::where('nom_serie', 'État-civil et Population')->first();
        $serieI = SerieArchive::where('nom_serie', 'Aménagement Urbain et Foncier')->first();
        $ss1A = SousSerie::where('libelle_sous_serie', '1A — Gestion administrative et réglementaire')->first();
        $ss2A = SousSerie::where('libelle_sous_serie', '2A — Cadre réglementaire et contentieux')->first();
        $ss1G = SousSerie::where('libelle_sous_serie', '1G — Enregistrement des faits d\'état civil')->first();
        $ss2I = SousSerie::where('libelle_sous_serie', '2I — Permis de construire')->first();
        $ss5I = SousSerie::where('libelle_sous_serie', '5I — Voirie et réseaux')->first();
        $serviceEC = Service::where('name', 'État Civil')->first();
        $serviceSG = Service::where('name', 'Secrétariat Général')->first();
        $serviceTech = Service::where('name', 'Technique')->first();
        $dirAG = Direction::where('nom_direction', 'Administration Générale')->first();
        $dirAS = Direction::where('nom_direction', 'Affaires Sociales et Culturelles')->first();
        $dirDU = Direction::where('nom_direction', 'Développement et Urbanisme')->first();
        $userMaoudo = User::where('email', 'maoudo.djossou@dangbo.bj')->first();
        $userRachelle = User::where('email', 'rachelle.akplogan@dangbo.bj')->first();

        $docs = [
            [
                'cote' => '2024-001', 'titre' => 'Registre des naissances — Arrondissement de Hozin',
                'id_serie' => $serieG?->id, 'id_sous_serie' => $ss1G?->id,
                'service_id' => $serviceEC?->id, 'direction_id' => $dirAS?->id,
                'date_enregistrement' => '2024-12-02', 'statut' => 'Courante',
                'format' => 'Registre relié', 'pages' => 214,
                'keywords' => ['naissance', 'Hozin', 'registre'],
                'user_id' => $userRachelle?->id,
                'indexed_by' => 'Rachelle Akplogan',
            ],
            [
                'cote' => '2024-002', 'titre' => 'Permis de construire — Lot 38, Dèkin-Hounhouè',
                'id_serie' => $serieI?->id, 'id_sous_serie' => $ss2I?->id,
                'service_id' => $serviceTech?->id, 'direction_id' => $dirDU?->id,
                'date_enregistrement' => '2024-11-21', 'statut' => 'Courante',
                'format' => 'Plan grand format', 'pages' => 9,
                'keywords' => ['permis', 'Dèkin', 'construction'],
                'user_id' => $userRachelle?->id,
                'indexed_by' => 'Rachelle Akplogan',
            ],
            [
                'cote' => '2024-003', 'titre' => 'Courrier arrivé — Préfecture de l\'Ouémé / Subvention FADeC',
                'id_serie' => $serieA?->id, 'id_sous_serie' => $ss1A?->id,
                'service_id' => $serviceSG?->id, 'direction_id' => $dirAG?->id,
                'date_enregistrement' => '2024-12-05', 'statut' => 'Courante',
                'format' => 'Feuille volante', 'pages' => 3,
                'keywords' => ['FADeC', 'subvention', 'préfecture'],
                'user_id' => $userMaoudo?->id,
                'indexed_by' => 'Maoudo Djossou',
            ],
            [
                'cote' => '2024-004', 'titre' => 'Registre des mariages — Dangbo Centre (1998)',
                'id_serie' => $serieG?->id, 'id_sous_serie' => $ss1G?->id,
                'service_id' => $serviceEC?->id, 'direction_id' => $dirAS?->id,
                'date_enregistrement' => '1998-06-30', 'statut' => 'Définitive',
                'format' => 'Registre relié', 'pages' => 156,
                'keywords' => ['mariage', '1998', 'Dangbo'],
                'user_id' => $userRachelle?->id,
                'indexed_by' => 'Rachelle Akplogan',
            ],
            [
                'cote' => '2024-005', 'titre' => 'Délibération budgétaire — Exercice 2025 (Projet)',
                'id_serie' => $serieA?->id, 'id_sous_serie' => $ss2A?->id,
                'service_id' => $serviceSG?->id, 'direction_id' => $dirAG?->id,
                'date_enregistrement' => '2024-11-28', 'statut' => 'Courante',
                'format' => 'Feuille volante', 'pages' => 18,
                'keywords' => ['budget', '2025', 'conseil'],
                'user_id' => $userMaoudo?->id,
                'indexed_by' => 'Maoudo Djossou',
            ],
            [
                'cote' => '2024-006', 'titre' => 'Plan de lotissement — Zone Gbéko Nord',
                'id_serie' => $serieI?->id, 'id_sous_serie' => $ss5I?->id,
                'service_id' => $serviceTech?->id, 'direction_id' => $dirDU?->id,
                'date_enregistrement' => '2023-09-12', 'statut' => 'Intermédiaire',
                'format' => 'Plan grand format', 'pages' => 6,
                'keywords' => ['lotissement', 'Gbéko', 'foncier'],
                'user_id' => $userRachelle?->id,
                'indexed_by' => 'Rachelle Akplogan',
            ],
        ];

        foreach ($docs as $doc) {
            Document::create($doc);
        }

        $this->command->info('✅ Données du cadre de classement importées :');
        $this->command->info('   ' . SousSerie::count() . ' sous-séries');
        $this->command->info('   ' . SerieArchive::count() . ' séries d\'archives');
        $this->command->info('✅ 3 utilisateurs créés :');
        $this->command->info('   admin      → maoudo.djossou@dangbo.bj / Dangbo2026');
        $this->command->info('   archiviste → rachelle.akplogan@dangbo.bj / Dangbo2026');
        $this->command->info('   agent      → a.tossou@dangbo.bj / Dangbo2026');
        $this->command->info('✅ ' . count($docs) . ' documents d\'exemple créés.');
    }
}
