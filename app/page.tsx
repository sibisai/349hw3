// app/page.tsx
'use client';
import { useEffect, useRef } from 'react';

export default function Page() {
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const baseUrl = 'https://api.themoviedb.org/3';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3NWU0ZjI4MzhmZGYzOGZlNDc2Y2FlMTZjMDM0ZWVkYyIsIm5iZiI6MTc1OTM1ODYwMy4xNDMwMDAxLCJzdWIiOiI2OGRkYWU4YjJjM2ViMTQ0ZjNmZDFmODgiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.wkhi34T4sR7A9UHJHVIyCgs9l30t5qAe9_zyyoXVRqc'
      }
    };

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const movieContainer = document.querySelector('.movie-container') as HTMLElement;
    const prevBtn = document.getElementById('prev-page') as HTMLButtonElement;
    const nextBtn = document.getElementById('next-page') as HTMLButtonElement;
    const currentPageEl = document.getElementById('current-page') as HTMLElement;
    const totalPagesEl = document.getElementById('total-pages') as HTMLElement;
    const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;

    let currentPage = 1;
    let totalPages = 1;
    let currentQuery = '';
    let lastResults: any[] = [];

    function buildUrl(path: string, params: any) {
      const u = new URL(`${baseUrl}${path}`);
      const p = new URLSearchParams({ language: 'en-US', page: String(params.page), ...params.extra });
      u.search = p.toString();
      return u.toString();
    }

    function endpointFor(query: string, page: number, sort: string) {
      if (query) {
        return buildUrl('/search/movie', { page, extra: { query } });
      }
      switch (sort) {
        case 'rating-desc':
          return buildUrl('/movie/top_rated', { page });
        case 'rating-asc':
          return buildUrl('/discover/movie', {
            page, extra: { include_adult: 'false', include_video: 'false', sort_by: 'vote_average.asc', 'vote_count.gte': '200' }
          });
        case 'release-desc':
          return buildUrl('/discover/movie', {
            page, extra: { include_adult: 'false', include_video: 'false', sort_by: 'primary_release_date.desc' }
          });
        case 'release-asc':
          return buildUrl('/discover/movie', {
            page, extra: { include_adult: 'false', include_video: 'false', sort_by: 'primary_release_date.asc' }
          });
        default:
          return buildUrl('/movie/popular', { page });
      }
    }

    async function fetchMovies(query = currentQuery, page = currentPage) {
      const sort = sortSelect?.value || '';
      const url = endpointFor(query, page, sort);
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        lastResults = data.results || [];
        displayMovies(lastResults);
        currentQuery = query;
        currentPage = data.page || 1;
        totalPages = data.total_pages || 1;
        updatePagination();
      } catch (e) {
        console.error(e);
        movieContainer.innerHTML = '<p>Error: Failed to load movies.</p>';
      }
    }

    function displayMovies(movies: any[]) {
      movieContainer.innerHTML = '';
      movies.forEach(m => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
          <img src="https://image.tmdb.org/t/p/w200${m.poster_path}">
          <h2>${m.title}</h2>
          <p>Release Date: ${m.release_date || 'N/A'}</p>
          <p>Rating: ${m.vote_average ?? 'N/A'}</p>`;
        movieContainer.appendChild(card);
      });
    }

    function updatePagination() {
      currentPageEl.textContent = String(currentPage);
      totalPagesEl.textContent = String(totalPages);
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
    }

    const onSortChange = () => {
      if (!currentQuery) { currentPage = 1; fetchMovies('', 1); return; }
      const v = sortSelect.value;
      const arr = [...lastResults];
      if (v === 'rating-asc') arr.sort((a,b)=>(a.vote_average??0)-(b.vote_average??0));
      else if (v === 'rating-desc') arr.sort((a,b)=>(b.vote_average??0)-(a.vote_average??0));
      else if (v === 'release-asc') arr.sort((a,b)=>(Date.parse(a.release_date||'0'))-(Date.parse(b.release_date||'0')));
      else if (v === 'release-desc') arr.sort((a,b)=>(Date.parse(b.release_date||'0'))-(Date.parse(a.release_date||'0')));
      displayMovies(arr);
    };
    const onSearchInput = () => { const q = searchInput.value.trim(); currentPage = 1; fetchMovies(q); };
    const onPrev = () => { if (currentPage > 1) fetchMovies(currentQuery, currentPage - 1); };
    const onNext = () => { if (currentPage < totalPages) fetchMovies(currentQuery, currentPage + 1); };

    sortSelect.addEventListener('change', onSortChange);
    searchInput.addEventListener('input', onSearchInput);
    prevBtn.addEventListener('click', onPrev);
    nextBtn.addEventListener('click', onNext);

    fetchMovies('');

    return () => {
      sortSelect.removeEventListener('change', onSortChange);
      searchInput.removeEventListener('input', onSearchInput);
      prevBtn.removeEventListener('click', onPrev);
      nextBtn.removeEventListener('click', onNext);
    };
  }, []);

  return (
    <main>
      <div className="header-container">
        <h1 id="title">Movie Explorer</h1>
      </div>

      <div className="search-container">
        <input id="search-input" type="text" placeholder="Search for a movie..." />
        <select id="sort-select">
          <option value="">Sort By</option>
          <option value="release-asc">Release Date (Asc)</option>
          <option value="release-desc">Release Date (Desc)</option>
          <option value="rating-asc">Rating (Asc)</option>
          <option value="rating-desc">Rating (Desc)</option>
        </select>
      </div>

      <div className="movie-container"></div>

      <div className="pagination-container">
        <button id="prev-page">Previous</button>
        <p>Page <span id="current-page">1</span> of <span id="total-pages">10</span></p>
        <button id="next-page">Next</button>
      </div>
    </main>
  );
}