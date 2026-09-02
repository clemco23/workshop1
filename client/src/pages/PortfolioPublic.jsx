import { useLoaderData } from 'react-router-dom'
import { fetchPortfolioPublic } from '../api/portfolios.js'
import { formatDate } from '../lib/format.js'

export async function loader({ params }) {
  return fetchPortfolioPublic(params.slug)
}

function videoEmbedUrl(link) {
  try {
    const url = new URL(link)
    const host = url.hostname.replace('www.', '')

    if (host === 'youtube.com' || host === 'youtu.be') {
      const id = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).at(-1)
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
  } catch {
    return null
  }

  return null
}

function ProjectMedia({ project }) {
  if (project.type === 'IMAGE') {
    return <img src={project.link} alt={project.titre} className="h-72 w-full object-cover" />
  }

  if (project.type === 'PDF') {
    return <iframe title={project.titre} src={project.link} className="h-96 w-full" loading="lazy" />
  }

  if (project.type === 'VIDEO') {
    const embedUrl = videoEmbedUrl(project.link)
    if (embedUrl) {
      return <iframe title={project.titre} src={embedUrl} className="aspect-video w-full" allowFullScreen />
    }
    return <video className="aspect-video w-full bg-black" controls src={project.link} />
  }

  return (
    <a
      href={project.link}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-48 items-center justify-center bg-slate-100 p-6 font-medium text-indigo-600 underline"
    >
      Ouvrir le lien externe
    </a>
  )
}

function PortfolioPublic() {
  const portfolio = useLoaderData()

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">Portfolio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {portfolio.titrePage}
          </h1>
          {portfolio.auteur && <p className="mt-2 text-slate-600">{portfolio.auteur}</p>}
        </header>

        {portfolio.projets.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Ce portfolio ne contient pas encore de projet.
          </p>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {portfolio.projets.map((project) => (
              <article
                key={`${project.ordre}-${project.titre}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <ProjectMedia project={project} />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-slate-950">{project.titre}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {project.tag === 'PRO' ? 'Pro' : 'Perso'}
                    </span>
                  </div>
                  {project.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p>
                  )}
                  <p className="mt-3 text-xs text-slate-500">{formatDate(project.date)}</p>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export default PortfolioPublic
