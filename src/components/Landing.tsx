import './landing.css'

const publicUrl = import.meta.env.BASE_URL

export function Landing({ onStart, onPosterStart }: { onStart: () => void; onPosterStart: () => void }) {
  const editors = [
    { title:'인생네컷 만들기', description:'1–9컷 사진 프레임', image:'home-fourcut-print.jpg', open:onStart },
    { title:'포스터 만들기', description:'A4 포스터와 액자 콜라주', image:'home-poster-print.jpg', open:onPosterStart },
  ]

  return (
    <main className="studio-home">
      <header className="studio-home-header">
        <div className="studio-home-brand">
          <img src={`${publicUrl}barabom-mark.svg`} alt="" width={42} height={42} />
          <div><strong>너를, 바라봄</strong><span>BARABOM STUDIO</span></div>
        </div>
      </header>

      <section className="studio-home-content" aria-labelledby="studio-home-title">
        <h1 id="studio-home-title">오늘을 한 장으로.</h1>
        <div className="studio-home-editors">
          {editors.map(({title, description, image, open}) => (
            <button key={title} type="button" className="studio-home-card" onClick={open}>
              <span className="studio-home-card-image">
                <img src={`${publicUrl}studio-assets/${image}`} alt="" width={1536} height={1024} />
              </span>
              <span className="studio-home-card-copy">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer className="studio-home-footer">사진은 브라우저 안에서만 처리됩니다.</footer>
    </main>
  )
}
