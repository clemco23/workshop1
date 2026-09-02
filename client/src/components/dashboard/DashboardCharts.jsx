import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import Card from '../ui/Card.jsx'
import { formatEuros, formatHeures } from '../../lib/format.js'
import { VIZ } from '../../lib/viz.js'

const TYPES = [
  { cle: 'INTERMITTENCE', label: 'Intermittence', color: VIZ.series.INTERMITTENCE },
  { cle: 'FREELANCE', label: 'Freelance', color: VIZ.series.FREELANCE },
]

function TooltipCirculaire({ active, payload, formatter }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0].payload

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-slate-900">{name}</p>
      <p className="mt-1 text-slate-600">{formatter(value)}</p>
    </div>
  )
}

function GraphiqueCirculaire({ donnees, metric }) {
  const estHeures = metric === 'heures'
  const prefix = estHeures ? 'heures' : 'ca'
  const formatter = estHeures ? (value) => `${formatHeures(value)} h` : formatEuros
  const series = TYPES.map((type) => ({
    name: type.label,
    value: donnees.reduce((total, mois) => total + mois[`${prefix}${type.cle === 'FREELANCE' ? 'Freelance' : 'Intermittence'}`], 0),
    color: type.color,
  }))
  const total = series.reduce((acc, ligne) => acc + ligne.value, 0)

  return (
    <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
      <div className="h-56" role="img" aria-label={`${estHeures ? 'Heures' : "Chiffre d'affaires"} repartis entre intermittence et freelance`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<TooltipCirculaire formatter={formatter} />} />
            <Pie
              data={series}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={88}
              paddingAngle={4}
              stroke="none"
            >
              {series.map((ligne) => <Cell key={ligne.name} fill={ligne.color} />)}
            </Pie>
            <text x="50%" y="47%" textAnchor="middle" className="fill-slate-900 text-xl font-semibold">
              {estHeures ? formatHeures(total) : formatEuros(total)}
            </text>
            <text x="50%" y="57%" textAnchor="middle" className="fill-slate-500 text-xs">
              {estHeures ? 'heures' : 'CA HT'}
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="space-y-3 text-sm">
        {series.map((ligne) => {
          const ratio = total > 0 ? Math.round((ligne.value / total) * 100) : 0
          return (
            <li key={ligne.name}>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: ligne.color }} />
                {ligne.name}
              </div>
              <p className="mt-0.5 pl-4.5 font-semibold text-slate-900">
                {formatter(ligne.value)} <span className="font-normal text-slate-400">({ratio} %)</span>
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DashboardCharts({ data }) {
  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-2">
      <Card title="Répartition des heures" subtitle="Missions confirmées et terminées">
        <GraphiqueCirculaire donnees={data} metric="heures" />
      </Card>
      <Card title="Répartition du chiffre d'affaires" subtitle="Montants HT des missions acquises">
        <GraphiqueCirculaire donnees={data} metric="ca" />
      </Card>
    </section>
  )
}

export default DashboardCharts
