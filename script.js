async function iniciarBusca() {
  const termoBusca = document.getElementById("campo-busca").value;
  const cardContainer = document.querySelector(".card-container");
  cardContainer.innerHTML = ""; // Limpa o container antes de adicionar novos cards

  if (!termoBusca) {
    cardContainer.innerHTML = "<p>Por favor, digite algo para pesquisar.</p>";
    return;
  }

  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const dados = await response.json();

    // Filtra os dados com base no termo de busca
    if (termoBusca === "*") {
      // Se o termo for "*", ordena por nome e exibe todos os itens
      const dadosOrdenados = dados.sort((a, b) => a.nome.localeCompare(b.nome));
      exibirResultados(dadosOrdenados);
      return;
    }

    const resultados = dados.filter((item) =>
      item.nome.toLowerCase().includes(termoBusca.toLowerCase())
    );

    if (resultados.length > 0) {
      // Se encontrou resultados no data.json, exibe-os
      exibirResultados(resultados);
    } else {
      // Se não encontrou, busca com a IA
      cardContainer.innerHTML = `<p>Não encontrei "${termoBusca}" em minha base. Buscando com a IA...</p>`;
      await buscarComIA(termoBusca);
    }
  } catch (error) {
    console.error("Erro ao buscar ou processar os dados:", error);
    cardContainer.innerHTML =
      '<p class="error-message">Não foi possível carregar os dados. Tente novamente mais tarde.</p>';
  }
}

function exibirResultados(resultados, geradoPorIA = false) {
  const cardContainer = document.querySelector(".card-container");

  // Limpa novamente para o caso da mensagem "Buscando com IA..."
  cardContainer.innerHTML = "";

  if (resultados.length === 0) {
    cardContainer.innerHTML = "<p>Nenhum resultado encontrado.</p>";
    return;
  }

  resultados.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card"; // Garante que a classe 'card' seja aplicada

    // Estrutura do card com logo e conteúdo de texto
    card.innerHTML = `
      ${
        item.logo
          ? `<div class="card-logo-container"><img src="${item.logo}" alt="Logo de ${item.nome}" class="card-logo"></div>`
          : ""
      }
      <div class="card-content">
        <div class="card-text-content">
          <h2>${item.nome} ${
      geradoPorIA ? '<span class="ai-badge">(Gerado por IA)</span>' : ""
    }</h2>
          <p><strong>Ano de criação:</strong> ${item.ano || "Não informado"}</p>
          <p>${item.descricao}</p>
        </div>
        <a href="${item.link || "#"}" target="_blank">Saiba mais...</a>
      </div>
    `;
    cardContainer.appendChild(card);
  });
}

async function buscarComIA(termo) {
  try {
    // 1. Enviar para o endpoint correto do servidor de backend
    const response = await fetch("http://localhost:3000/api/buscar-ia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 2. Enviar o termo de busca no corpo da requisição
      body: JSON.stringify({ termo: termo }),
    });

    if (!response.ok)
      // Se o servidor retornar 500 ou outro erro, capturamos aqui
      throw new Error(`Erro no servidor de backend: ${response.statusText}`);

    // O servidor (server.js) já retorna o JSON limpo (iaResult)
    const iaResult = await response.json();

    if (iaResult.erro) {
      exibirResultados([]); // Mostra "Nenhum resultado encontrado"
    } else {
      // O resultado já é o objeto JSON que queremos
      exibirResultados([iaResult], true); // Exibe o resultado da IA
    }
  } catch (error) {
    console.error("Erro ao buscar com a IA:", error);
    const cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = `<p class="error-message">A busca com IA falhou. ${error.message}.</p>`;
  }
}
