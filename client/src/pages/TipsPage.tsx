function TipsPage() {
  const tips = [
    {
      category: 'Batch Cooking Basics',
      icon: '📦',
      items: [
        {
          title: 'Kies de juiste recepten',
          description: 'Niet alle gerechten zijn geschikt voor batch cooking. Kies recepten met een hoge batch cooking score (4-5 sterren) zoals stoofpotten, curry\'s, soepen en sauzen.',
        },
        {
          title: 'Kook in grote porties',
          description: 'Maak minimaal 6-8 porties tegelijk. De extra moeite is minimaal, maar je bespaart veel tijd door de week heen.',
        },
        {
          title: 'Investeer in goede bakjes',
          description: 'Gebruik stevige, luchtdichte bakjes die geschikt zijn voor zowel vriezer als magnetron. Glazen bakjes zijn duurzaam en milieuvriendelijk.',
        },
        {
          title: 'Label alles',
          description: 'Schrijf altijd de naam van het gerecht en de datum op je bakjes. Zo weet je precies wat je hebt en wanneer het op moet.',
        },
      ],
    },
    {
      category: 'Invriezen & Bewaren',
      icon: '❄️',
      items: [
        {
          title: 'Laat eerst afkoelen',
          description: 'Laat eten altijd volledig afkoelen voordat je het in de vriezer zet. Dit voorkomt ijskristallen en houdt de structuur beter.',
        },
        {
          title: 'Vries in porties',
          description: 'Vries je maaltijden in losse porties in. Zo kun je precies ontdooien wat je nodig hebt zonder verspilling.',
        },
        {
          title: 'Houd rekening met uitzetting',
          description: 'Vul bakjes niet helemaal vol - eten zet uit tijdens het bevriezen. Laat 1-2 cm ruimte over.',
        },
        {
          title: 'First in, first out',
          description: 'Gebruik altijd het oudste eten eerst. Zet nieuwe porties achter de oude in de vriezer.',
        },
      ],
    },
    {
      category: 'Variatie Tips',
      icon: '🔄',
      items: [
        {
          title: 'Maak een basis, varieer de topping',
          description: 'Kook bijvoorbeeld een grote pot chili en serveer dag 1 met rijst, dag 2 op nachos, dag 3 in wraps. Zo eet je niet elke dag "hetzelfde".',
        },
        {
          title: 'Verschillende smaken toevoegen',
          description: 'Voeg verse kruiden, kaas, of sausjes pas toe bij het serveren. Dit maakt elke maaltijd weer anders.',
        },
        {
          title: 'Mix and match',
          description: 'Combineer verschillende batch-cooked componenten. Een basis bolognesesaus werkt op pasta, in lasagne, en als vulling voor paprika\'s.',
        },
        {
          title: 'Kook meerdere basisgerechten',
          description: 'Maak op zondag 2-3 verschillende basis maaltijden. Zo heb je de hele week keuze.',
        },
      ],
    },
    {
      category: 'Budget Tips',
      icon: '💰',
      items: [
        {
          title: 'Plan op basis van aanbiedingen',
          description: 'Bekijk eerst wat in de aanbieding is en kies dan je recepten. Niet andersom!',
        },
        {
          title: 'Koop voordeelverpakkingen',
          description: 'Grote verpakkingen vlees of groenten zijn vaak goedkoper per kilo. Deel op en vries in.',
        },
        {
          title: 'Bespaar op vlees',
          description: 'Vervang een deel van het gehakt door linzen of bonen. Goedkoper, gezonder, en net zo lekker!',
        },
        {
          title: 'Gooi niets weg',
          description: 'Gebruik groenterestjes voor soep of bouillon. Rijpe fruit? Maak er smoothies of compote van.',
        },
      ],
    },
    {
      category: 'Keukenefficiency',
      icon: '⚡',
      items: [
        {
          title: 'Prep alles vooraf',
          description: 'Snijd alle groenten voordat je begint met koken. Dit maakt het kookproces veel soepeler.',
        },
        {
          title: 'Gebruik meerdere pannen',
          description: 'Kook rijst terwijl je curry suddert. Bak gehakt terwijl de groenten snijdt. Multitasken bespaart tijd!',
        },
        {
          title: 'Maak de keuken schoon terwijl je wacht',
          description: 'Terwijl iets suddert of in de oven staat, ruim je al op. Na het eten hoef je alleen nog te genieten.',
        },
        {
          title: 'Kook slim door de week',
          description: 'Zondag is een goede dag voor batch cooking. Je hebt de tijd en begint de week met gevulde bakjes.',
        },
      ],
    },
  ];

  const pantryStaples = [
    { name: 'Zout & peper', category: 'Kruiden' },
    { name: 'Paprikapoeder', category: 'Kruiden' },
    { name: 'Komijn', category: 'Kruiden' },
    { name: 'Kerrie', category: 'Kruiden' },
    { name: 'Oregano', category: 'Kruiden' },
    { name: 'Tijm', category: 'Kruiden' },
    { name: 'Laurierblad', category: 'Kruiden' },
    { name: 'Zonnebloemolie', category: 'Olie' },
    { name: 'Olijfolie', category: 'Olie' },
    { name: 'Bloem', category: 'Bakken' },
    { name: 'Suiker', category: 'Bakken' },
    { name: 'Bouillonblokjes', category: 'Basis' },
    { name: 'Tomatenpuree', category: 'Basis' },
    { name: 'Sojasaus', category: 'Sauzen' },
    { name: 'Azijn', category: 'Sauzen' },
    { name: 'Mosterd', category: 'Sauzen' },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Batch Cooking Tips</h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          Leer slim koken, bespaar tijd en geld, en eet toch gevarieerd door de week.
          Met deze tips word je een echte batch cooking pro!
        </p>
      </div>

      {/* Tips Sections */}
      {tips.map((section) => (
        <section key={section.category}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{section.icon}</span>
            <h2 className="text-2xl font-bold text-gray-900">{section.category}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {section.items.map((tip, index) => (
              <div key={index} className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-gray-600 text-sm">{tip.description}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Pantry Staples */}
      <section className="bg-emerald-50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🏠</span>
          <h2 className="text-2xl font-bold text-gray-900">Voorraadkast Basis</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Met deze basisproducten in huis kun je bijna alle recepten maken.
          We gaan ervan uit dat deze altijd aanwezig zijn en rekenen ze niet mee in de kosten.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pantryStaples.map((item) => (
            <div key={item.name} className="bg-white rounded-lg p-3">
              <div className="font-medium text-gray-900 text-sm">{item.name}</div>
              <div className="text-xs text-gray-500">{item.category}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Routine */}
      <section className="bg-amber-50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">📅</span>
          <h2 className="text-2xl font-bold text-gray-900">Wekelijkse Routine</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 flex gap-4">
            <div className="w-24 flex-shrink-0 font-semibold text-amber-700">Zaterdag</div>
            <div>
              <p className="font-medium">Plan je week</p>
              <p className="text-sm text-gray-600">
                Bekijk de aanbiedingen, kies je recepten, en maak je boodschappenlijst.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 flex gap-4">
            <div className="w-24 flex-shrink-0 font-semibold text-amber-700">Zondag</div>
            <div>
              <p className="font-medium">Batch cooking dag</p>
              <p className="text-sm text-gray-600">
                Neem 2-3 uur om 2-3 grote recepten te maken. Verdeel in porties en vries in.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 flex gap-4">
            <div className="w-24 flex-shrink-0 font-semibold text-amber-700">Doordeweeks</div>
            <div>
              <p className="font-medium">Opwarmen en genieten</p>
              <p className="text-sm text-gray-600">
                Haal 's ochtends een portie uit de vriezer. 's Avonds alleen nog opwarmen!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Storage Times */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">⏰</span>
          <h2 className="text-2xl font-bold text-gray-900">Bewaartijden</h2>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type gerecht</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Koelkast</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Vriezer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-6 py-4">Stoofpotten & curry's</td>
                <td className="px-6 py-4 text-gray-600">4-5 dagen</td>
                <td className="px-6 py-4 text-gray-600">2-3 maanden</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Soepen</td>
                <td className="px-6 py-4 text-gray-600">4-5 dagen</td>
                <td className="px-6 py-4 text-gray-600">2-3 maanden</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Sauzen (bolognese, etc.)</td>
                <td className="px-6 py-4 text-gray-600">4-5 dagen</td>
                <td className="px-6 py-4 text-gray-600">3 maanden</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Gekookte rijst/pasta</td>
                <td className="px-6 py-4 text-gray-600">2-3 dagen</td>
                <td className="px-6 py-4 text-gray-600">1-2 maanden</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Stamppotten</td>
                <td className="px-6 py-4 text-gray-600">2-3 dagen</td>
                <td className="px-6 py-4 text-gray-600">Niet geschikt</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Pulled pork/vlees</td>
                <td className="px-6 py-4 text-gray-600">4-5 dagen</td>
                <td className="px-6 py-4 text-gray-600">3 maanden</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default TipsPage;
