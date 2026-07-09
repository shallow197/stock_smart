<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Client;
use App\Models\Product;
use App\Models\User;
use App\Services\CreditService;
use App\Services\SaleService;
use App\Services\StockService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);
        $stockService = app(StockService::class);
        $creditService = app(CreditService::class);

        // --- Commerçant de démonstration ---
        $user = User::updateOrCreate(
            ['email' => 'ousmane@boutique.sn'],
            [
                'name' => 'Ousmane Diallo',
                'phone' => '+221771234567',
                'password' => Hash::make('password'),
                'shop_name' => 'Boutique Keur Massar',
                'shop_address' => 'Keur Massar, Dakar',
                'currency' => 'FCFA',
                'locale' => 'fr',
                'timezone' => 'Africa/Dakar',
            ],
        );

        // --- Catégories multi-secteurs (l'appli n'est pas limitée à l'épicerie) ---
        $catNames = ['Céréales', 'Épicerie', 'Boissons', 'Hygiène', 'Laiterie', 'Meubles & literie', 'Cosmétiques', 'Papeterie'];
        $cats = [];
        foreach ($catNames as $name) {
            $cats[$name] = Category::updateOrCreate(['user_id' => $user->id, 'name' => $name], []);
        }

        // --- Catalogue produits ---
        // [nom, catégorie, prix achat, prix vente, stock initial, unité, seuil]
        $catalogue = [
            // Épicerie / alimentation
            ['Riz parfumé 25 kg', 'Céréales', 13200, 14500, 42, 'sac', 10],
            ['Huile végétale 5 L', 'Épicerie', 6800, 8200, 8, 'bidon', 10],
            ['Sucre en poudre 1 kg', 'Épicerie', 700, 850, 0, 'kg', 15],
            ['Lait concentré 397 g', 'Laiterie', 950, 1250, 64, 'boîte', 12],
            ['Savon liquide 1 L', 'Hygiène', 1500, 2000, 5, 'unité', 8],
            ['Thé vert 50 sachets', 'Boissons', 1100, 1500, 22, 'boîte', 6],
            ['Café Touba 500 g', 'Boissons', 1800, 2400, 30, 'sachet', 8],
            ['Pâtes alimentaires 500 g', 'Épicerie', 350, 500, 120, 'paquet', 20],
            ['Lait en poudre 25 g', 'Laiterie', 120, 200, 0, 'sachet', 30],
            ['Eau minérale 1,5 L', 'Boissons', 300, 500, 96, 'bouteille', 24],
            // Autres secteurs — pour montrer la polyvalence
            ['Matelas mousse 140×190', 'Meubles & literie', 32000, 45000, 6, 'unité', 3],
            ['Matelas ressorts 160×200', 'Meubles & literie', 58000, 78000, 4, 'unité', 2],
            ['Oreiller mémoire de forme', 'Meubles & literie', 3500, 6000, 18, 'unité', 5],
            ['Crème hydratante karité', 'Cosmétiques', 1800, 3000, 40, 'pot', 10],
            ['Savon noir africain', 'Cosmétiques', 900, 1500, 9, 'unité', 6],
            ['Cahier 200 pages', 'Papeterie', 400, 700, 150, 'unité', 30],
            ['Stylo bille (boîte de 50)', 'Papeterie', 2500, 4000, 12, 'boîte', 4],
            ['Ramette papier A4', 'Papeterie', 2800, 3800, 9, 'ramette', 5],
        ];

        $products = [];
        foreach ($catalogue as [$name, $cat, $buy, $sell, $stock, $unit, $threshold]) {
            $p = Product::updateOrCreate(
                ['user_id' => $user->id, 'name' => $name],
                [
                    'category_id' => $cats[$cat]->id,
                    'purchase_price' => $buy,
                    'sale_price' => $sell,
                    'unit' => $unit,
                    'alert_threshold' => $threshold,
                    'stock' => 0,
                ],
            );
            // Stock initial via un vrai mouvement (si pas déjà stocké).
            if ($p->stockMovements()->count() === 0 && $stock > 0) {
                $stockService->move($p, 'initial', $stock, 'Stock initial', $buy, occurredAt: now()->subDays(20));
            }
            $products[$name] = $p->fresh();
        }

        // --- Clients (noms & quartiers de Dakar) ---
        $clientData = [
            ['Fatou Ndiaye', '+221775551234', 'Keur Massar, Dakar'],
            ['Modou Diop', '+221782224567', 'Parcelles Assainies, Dakar'],
            ['Awa Sarr', '+221768889911', 'Guédiawaye, Dakar'],
            ['Ibrahima Ba', '+221773332211', 'Pikine, Dakar'],
            ['Aminata Sow', '+221701112233', 'Yoff, Dakar'],
            ['Cheikh Kane', '+221784445566', 'Grand Yoff, Dakar'],
            ['Mariama Fall', '+221765554433', 'Rufisque, Dakar'],
        ];
        $clients = [];
        foreach ($clientData as [$name, $phone, $address]) {
            $clients[$name] = Client::updateOrCreate(
                ['user_id' => $user->id, 'phone' => $phone],
                ['name' => $name, 'address' => $address],
            );
        }

        // Ne pas re-générer les ventes si déjà présentes.
        if ($user->sales()->exists()) {
            $this->command?->info('Données déjà présentes — ventes non régénérées.');
            return;
        }

        // --- Ventes à crédit ciblées EN PREMIER (garantit le stock) ---
        $this->creditSale($saleService, $user, $clients['Fatou Ndiaye'], $products['Riz parfumé 25 kg'], 2, now()->subDays(4));
        $this->creditSale($saleService, $user, $clients['Awa Sarr'], $products['Café Touba 500 g'], 4, now()->subDays(9));
        $this->creditSale($saleService, $user, $clients['Aminata Sow'], $products['Matelas mousse 140×190'], 1, now()->subDays(40)); // > 30 j → en retard
        try {
            $creditService->recordPayment($clients['Fatou Ndiaye'], 12000, 'cash', 'Acompte', now()->subDays(1));
        } catch (\Throwable $e) {
        }

        // --- Historique de ventes comptant sur 13 jours (dashboard + top produits) ---
        // On exclut les produits réservés à la démo crédit pour garder des encours nets.
        // On ne pioche que dans les produits à gros stock (hors produits réservés
        // aux ventes à crédit) pour ne pas provoquer de ruptures artificielles.
        $creditDemo = ['Matelas mousse 140×190', 'Riz parfumé 25 kg', 'Café Touba 500 g'];
        $sellable = collect($products)
            ->reject(fn ($p) => in_array($p->name, $creditDemo, true))
            ->filter(fn ($p) => (float) $p->fresh()->stock > 30)->values();
        for ($d = 6; $d >= 0; $d--) {
            $day = now()->subDays($d);
            $nbSales = random_int(2, 4);
            for ($s = 0; $s < $nbSales; $s++) {
                $lineCount = random_int(1, 3);
                $items = [];
                $picked = $sellable->shuffle()->take($lineCount);
                foreach ($picked as $p) {
                    $fresh = $p->fresh();
                    if ((float) $fresh->stock < 1) {
                        continue;
                    }
                    $qty = min(random_int(1, 2), (int) floor((float) $fresh->stock));
                    if ($qty < 1) {
                        continue;
                    }
                    $items[] = ['product_id' => $fresh->id, 'quantity' => $qty];
                }
                if (empty($items)) {
                    continue;
                }
                $withClient = random_int(1, 100) <= 40;
                $soldAt = $day->copy()->setTime(random_int(8, 19), random_int(0, 59));
                try {
                    $saleService->create(
                        user: $user,
                        items: $items,
                        paymentMethod: 'cash',
                        clientId: $withClient ? $clients[array_rand($clients)]->id : null,
                        soldAt: $soldAt,
                    );
                } catch (\Throwable $e) {
                    // Stock insuffisant sur un tirage — on ignore.
                }
            }
        }

        $this->command?->info('Seed EcoStock terminé — connexion : ousmane@boutique.sn / password');
    }

    private function creditSale(SaleService $service, User $user, Client $client, Product $product, int $qty, Carbon $when): void
    {
        $fresh = $product->fresh();
        if ((float) $fresh->stock < $qty) {
            return;
        }
        try {
            $service->create(
                user: $user,
                items: [['product_id' => $fresh->id, 'quantity' => $qty]],
                paymentMethod: 'credit',
                clientId: $client->id,
                soldAt: $when,
            );
        } catch (\Throwable $e) {
        }
    }
}
