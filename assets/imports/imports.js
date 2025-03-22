async function loadHTML(url, element) {
  const response = await fetch(url);
  const html = await response.text();
  document.getElementById(element).innerHTML = html;
}

// Import navbar.html into #navbar
loadHTML('/assets/headerNav/header.html', 'headerNavbar');

async function loadHTML(url, element) {
  const response = await fetch(url);
  const html = await response.text();
  document.getElementById(element).innerHTML = html;
}

// Import footer.html into #footer
loadHTML('/assets/footer/footer.html', 'footer');
