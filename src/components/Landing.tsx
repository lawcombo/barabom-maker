import { ArrowUpRight, Images, WandSparkles } from 'lucide-react'

export function Landing({ onStart, onPosterStart }: { onStart: () => void; onPosterStart: () => void }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f7fb] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3"><img src={`${import.meta.env.BASE_URL}barabom-mark.svg`} alt="너를, 바라봄 로고" className="size-11"/><div><p className="font-['Noto_Serif_KR'] text-[17px] font-semibold leading-tight tracking-[-.035em]">너를, 바라봄</p><p className="mt-1 text-[10px] font-semibold tracking-[.22em] text-[#8a6f47]">BARABOM STUDIO</p></div></div>
        <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 sm:block">사진은 브라우저 안에서만 처리돼요</div>
      </header>
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-10 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700"><WandSparkles size={16}/> 쉬운 편집, 인화까지 한 번에</div>
          <h1 className="text-balance text-5xl font-bold leading-[1.08] tracking-[-.05em] sm:text-6xl lg:text-7xl">오늘의 장면을<br/><span className="font-serif text-violet-600">오래 남길</span> 한 장으로.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">사진을 넣고, 프레임과 문구를 고른 뒤 바로 저장하세요. 복잡한 디자인 도구 없이도 사진관 품질의 포토 스트립을 만들 수 있어요.</p>
          <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-500"><span>1–9컷 레이아웃</span><span>·</span><span>22가지 템플릿</span><span>·</span><span>300DPI 출력</span></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <button onClick={onStart} className="group relative min-h-[430px] overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-left text-white shadow-soft transition hover:-translate-y-1">
            <div className="absolute inset-x-8 top-8 mx-auto grid h-[280px] max-w-[190px] grid-cols-2 gap-2 rounded-xl bg-[#ffcfdf] p-3 shadow-2xl rotate-[-3deg] transition duration-500 group-hover:rotate-0">
              {['#d8d4ee','#c4d9e7','#ecd1c6','#cbe3d3'].map((color) => <div key={color} className="rounded-md" style={{ background: `linear-gradient(145deg,${color},#64748b)` }}/>) }
              <p className="col-span-2 py-1 text-center font-['Gaegu'] text-sm font-bold text-[#9d315c]">오늘의 우리 ♥</p>
            </div>
            <div className="absolute inset-x-7 bottom-7"><div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-white/10 px-3 py-1 text-xs">바로 만들기</span><ArrowUpRight className="transition group-hover:rotate-45"/></div><h2 className="text-2xl font-bold">인생네컷 만들기</h2><p className="mt-2 text-sm leading-6 text-white/60">사진 여러 장을 감각적인 프레임에 담아보세요.</p></div>
          </button>
          <button onClick={onPosterStart} className="group relative min-h-[430px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 text-left shadow-soft transition hover:-translate-y-1 hover:border-amber-300">
            <div className="absolute inset-x-8 top-8 h-[270px] rotate-3 rounded-xl bg-gradient-to-br from-amber-100 via-orange-100 to-rose-200 p-6 text-center text-slate-800 opacity-75"><p className="text-xs font-bold tracking-[.3em]">WEEKEND</p><p className="mt-12 font-serif text-4xl italic">Summer<br/>Archive</p><div className="mx-auto mt-7 h-1 w-12 bg-slate-800"/></div>
            <div className="absolute inset-x-7 bottom-7"><div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">54가지 템플릿</span><Images className="text-amber-500 transition group-hover:scale-110"/></div><h2 className="text-2xl font-bold text-slate-800">포스터 만들기</h2><p className="mt-2 text-sm leading-6 text-slate-500">사진·글씨·스티커를 자유롭게 배치하고 고해상도로 저장하세요.</p></div>
          </button>
        </div>
      </section>
    </main>
  )
}
