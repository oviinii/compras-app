export interface ParsedItem {
  name: string
  quantity: number
  unit: string
  category: string
  price: number
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Hortifrúti': [
    'banana', 'maçã', 'maca', 'laranja', 'limão', 'limao', 'tomate', 'alface',
    'cebola', 'alho', 'batata', 'cenoura', 'mamão', 'mamao', 'abacaxi', 'uva',
    'morango', 'melancia', 'melão', 'melao', 'abóbora', 'abobora', 'pimentão',
    'pimentao', 'brócolis', 'brocolis', 'couve', 'espinafre', 'fruta', 'legumes',
    'verdura', 'abacate', 'manga', 'maracujá', 'maracuja'
  ],
  'Laticínios': [
    'leite', 'queijo', 'presunto', 'iogurte', 'manteiga', 'requeijão', 'requeijao',
    'creme de leite', 'leite condensado', 'nata', 'mussarela', 'musarela', 'catupiry',
    'ricota', 'parmesão', 'parmesao', 'margarina'
  ],
  'Padaria': [
    'pão', 'pao', 'torrada', 'bolo', 'biscoito', 'bolacha', 'pão de queijo',
    'pao de queijo', 'croissant', 'brioche', 'rosca', 'pão francês', 'pao frances'
  ],
  'Carnes': [
    'carne', 'frango', 'peixe', 'linguiça', 'linguica', 'salsicha', 'bacon',
    'costela', 'picanha', 'alcatra', 'hambúrguer', 'hamburguer', 'bisteca',
    'peito de frango', 'carne moída', 'carne moida', 'camarão', 'camarao',
    'salmão', 'salmao', 'pernil', 'lombo', 'coxa'
  ],
  'Bebidas': [
    'água', 'agua', 'refrigerante', 'coca', 'guaraná', 'guarana', 'suco',
    'cerveja', 'vinho', 'café', 'cafe', 'chá', 'cha', 'energético', 'energetico',
    'vodka', 'gin', 'tônica', 'tonica', 'toddy', 'nescau'
  ],
  'Limpeza': [
    'detergente', 'sabão', 'sabao', 'amaciante', 'água sanitária', 'agua sanitaria',
    'desinfetante', 'esponja', 'papel toalha', 'saco de lixo', ' veja', 'omo',
    'lisoform', 'multiuso', 'lustra móveis', 'lustra moveis'
  ],
  'Higiene': [
    'sabonete', 'shampoo', 'condicionador', 'pasta de dente', 'creme dental',
    'escova', 'papel higiênico', 'papel higienico', 'fio dental', 'desodorante',
    'fralda', 'cotonete', 'absorvente'
  ],
  'Mercearia': [
    'arroz', 'feijão', 'feijao', 'macarrão', 'macarrao', 'óleo', 'oleo',
    'azeite', 'açúcar', 'acucar', 'sal', 'farinha', 'molho', 'extrato',
    'milho', 'ervilha', 'atum', 'sardinha', 'maionese', 'ketchup', 'mostarda'
  ]
}

export function detectCategory(text: string): string {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }
  return 'Mercearia'
}

export function parseMessageToItem(text: string): ParsedItem {
  let cleanText = text.trim()
  let quantity = 1
  let unit = 'un'
  let price = 0

  const priceRegex = /(?:R\$\s*|R\$)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)?/i
  const priceMatch = cleanText.match(/(?:R\$\s*|R\$)\s*(\d+(?:[.,]\d{1,2})?)/i)
    || cleanText.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)/i)

  if (priceMatch) {
    price = parseFloat(priceMatch[1].replace(',', '.'))
    cleanText = cleanText.replace(priceMatch[0], '').trim()
  }

  const qtyUnitRegex = /^(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|un|pct|cx|pacote|caixa|caixas|pacotes|unidades|unidade|litro|litros|kilos|kilo|quilo|quilos)?\s*(?:de\s+)?/i
  const qtyMatch = cleanText.match(qtyUnitRegex)

  if (qtyMatch) {
    quantity = parseFloat(qtyMatch[1].replace(',', '.'))
    const rawUnit = (qtyMatch[2] || '').toLowerCase()
    
    if (['kg', 'kilos', 'kilo', 'quilo', 'quilos'].includes(rawUnit)) unit = 'kg'
    else if (['g', 'gramas'].includes(rawUnit)) unit = 'g'
    else if (['l', 'litro', 'litros'].includes(rawUnit)) unit = 'L'
    else if (['ml'].includes(rawUnit)) unit = 'ml'
    else if (['pct', 'pacote', 'pacotes'].includes(rawUnit)) unit = 'pct'
    else if (['cx', 'caixa', 'caixas'].includes(rawUnit)) unit = 'cx'
    else unit = 'un'

    cleanText = cleanText.replace(qtyMatch[0], '').trim()
  } else {
    const trailingQtyMatch = cleanText.match(/\s+(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|un|pct|cx|pacote|caixa|caixas|pacotes|unidades|unidade|litro|litros|kilos|kilo|quilo|quilos)?$/i)
    if (trailingQtyMatch) {
      quantity = parseFloat(trailingQtyMatch[1].replace(',', '.'))
      const rawUnit = (trailingQtyMatch[2] || '').toLowerCase()

      if (['kg', 'kilos', 'kilo', 'quilo', 'quilos'].includes(rawUnit)) unit = 'kg'
      else if (['g', 'gramas'].includes(rawUnit)) unit = 'g'
      else if (['l', 'litro', 'litros'].includes(rawUnit)) unit = 'L'
      else if (['ml'].includes(rawUnit)) unit = 'ml'
      else if (['pct', 'pacote', 'pacotes'].includes(rawUnit)) unit = 'pct'
      else if (['cx', 'caixa', 'caixas'].includes(rawUnit)) unit = 'cx'
      else unit = 'un'

      cleanText = cleanText.replace(trailingQtyMatch[0], '').trim()
    }
  }

  const name = cleanText.charAt(0).toUpperCase() + cleanText.slice(1)
  const category = detectCategory(name)

  return {
    name: name || 'Novo Item',
    quantity: quantity || 1,
    unit,
    category,
    price: price || 0
  }
}
