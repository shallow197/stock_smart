import { Outlet, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import VoiceButton from "./VoiceButton";
import voice from "../lib/voice";
import { api } from "../lib/api";

const normalizeProductName = (value) => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(?:de|du|des|le|la|les|un|une|et|sacs?|kg|g|litres?|litre|vendu|vendus|ajoute|ajout|approvisionnement)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const findProductInList = (products, rawName) => {
  const cleaned = normalizeProductName(rawName);
  if (!cleaned) return null;
  const terms = cleaned.split(' ').filter(Boolean);
  const direct = products.find((p) => normalizeProductName(p.name).includes(cleaned));
  if (direct) return direct;
  return products.find((p) => {
    const normalized = normalizeProductName(p.name);
    return terms.every((term) => normalized.includes(term));
  });
};

const findProduct = async (rawName) => {
  const cleaned = normalizeProductName(rawName);
  if (!cleaned) return null;

  const allRes = await api.get('/products');
  const allProducts = allRes.data || allRes;
  let found = findProductInList(allProducts, cleaned);
  if (found) return found;

  const searchRes = await api.get(`/products?search=${encodeURIComponent(cleaned)}`);
  const searchProducts = searchRes.data || searchRes;
  return findProductInList(searchProducts, cleaned);
};

// Coquille des écrans principaux : contenu défilant + navigation basse.
export default function AppShell() {
  const navigate = useNavigate();

  const handleCommand = async (text) => {
    const t = text.toLowerCase();

    // Stock entry: "ajoute 10 riz" -> automatically post stock entry
    const stockMatch = t.match(/^(?:ajoute|ajout|approvisionnement)\s+(?:de\s+)?(\d+)\s+(.+)$/);
    if (stockMatch) {
      const qty = Number(stockMatch[1]);
      const productName = stockMatch[2].trim();
      voice.speak(`Recherche du produit ${productName}`);
      try {
        const found = await findProduct(productName);
        if (!found) {
          voice.speak(`Produit ${productName} introuvable.`);
          return;
        }
        await api.post(`/products/${found.id}/stock-entry`, { quantity: qty });
        voice.speak(`Entrée de ${qty} ${found.name} enregistrée.`);
        navigate(`/stock/${found.id}`);
      } catch (e) {
        console.error('Erreur entrée vocale stock', e);
        voice.speak("Impossible d'enregistrer l'entrée de stock.");
      }
      return;
    }

    // Vente: parse only if a sale keyword is present or if the phrase ends with "vendu(s)"
    const venteMatch = t.match(/^(?:(?:enregistre|enregistrer|vendre)\s*)?(\d+)\s*(?:sacs?|kg|litres?)?\s*(?:de\s+)?(.+?)(?:\s*(?:vendu|vendus))?$/);
    if (venteMatch) {
      const hasSaleKeyword = /^(?:enregistre|enregistrer|vendre)\b/.test(t) || /(?:vendu|vendus)$/.test(t);
      if (hasSaleKeyword) {
        const qty = Number(venteMatch[1]);
        const productName = (venteMatch[2] || '').trim();
        voice.speak(`Je cherche ${qty} ${productName}`);
        try {
          const found = await findProduct(productName);
          if (!found) {
            voice.speak(`Produit ${productName} introuvable.`);
            return;
          }
          // build payload
          const payload = { items: [{ product_id: found.id, quantity: qty }], payment_method: 'cash', client_id: null };
          const r = await api.post('/sales', payload);
          voice.speak(`${qty} ${found.name} vendus. Vente enregistrée.`);
          navigate(`/ventes/${r.data.id}`);
        } catch (e) {
          console.error('Erreur saisie vocale vente', e);
          voice.speak('Impossible d\'enregistrer la vente.');
        }
        return;
      }
    }

    // Alerts: "lire les alertes" -> fetch and read them aloud
    if (t.includes('alerte') || t.includes('alertes') || t.includes('lire les alertes')) {
      try {
        const res = await api.get('/alerts');
        const alerts = (res.data || res) || [];
        if (!alerts.length) {
          voice.speak("Aucune alerte active.");
          navigate('/alertes');
          return;
        }
        // Read a short summary: title and 1-line message for up to 5 alerts
        const toRead = alerts.slice(0, 5).map((a, i) => `Alerte ${i + 1}: ${a.title}. ${a.message}`).join('. ');
        voice.speak(`Voici ${alerts.length} alerte${alerts.length > 1 ? 's' : ''}. ${toRead}`);
        navigate('/alertes');
      } catch (e) {
        console.error('Erreur récupération alertes', e);
        voice.speak("Impossible de récupérer les alertes.");
      }
      return;
    }

    // Fallback: speak acknowledgement
    voice.speak('Commande vocale reçue : ' + text);
  };

  return (
    <div className="app-frame pb-28 lg:pb-10">
      <Outlet />
      <BottomNav />
      <VoiceButton onCommand={handleCommand} />
    </div>
  );
}
