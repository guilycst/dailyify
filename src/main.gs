/**
 * Ponto de entrada quando um evento do calendário é aberto.
 */
function onEventOpen(e) {
  return buildApp(e, {});
}

/**
 * Fallback para a Home
 */
function onHomepage(e) {
  return View.createMessageCard("Abra um evento de reunião no seu calendário para organizar a Daily.");
}

/**
 * O Controlador principal que orquestra a injeção de dependências.
 */
function buildApp(e, options) {
  var forceRandomize = options.forceRandomize || false;
  var resetScores = options.resetScores || false;

  // 1. Repository: Obtém informações do evento
  var info = Repository.getMeetingInfo(e);
  if (!info) return View.createMessageCard("Não foi possível aceder aos detalhes deste evento.");

  // 2. Repository: Obtém convidados (com cache integrado)
  var guestsObj = Repository.getGuestsData(info.event);
  if (guestsObj.allEmails.length === 0) return View.createMessageCard("Nenhum participante válido encontrado nesta reunião.");

  // 3. Repository: Estado atual da Reunião
  var state = Repository.getMeetingState(info.title, info.dateKey);

  // 4. Model: Processa regras de negócio
  var processedData = Model.processScores(info, guestsObj, state, forceRandomize, resetScores);

  // 5. View: Renderiza interface (sem abas virtuais)
  return View.createMainCard(info, guestsObj, processedData);
}

// ==========================================
// CALLBACKS DE AÇÕES DA VIEW
// ==========================================

function actionToggleGuest(e) {
  var selectedEmail = e.formInput.selectedEmail;
  if (!selectedEmail) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Nenhum participante selecionado."))
      .build();
  }

  var isExcluded = Repository.toggleGuestExclusion(e.parameters.title, e.parameters.dateKey, selectedEmail);
  var msg = isExcluded ? "Participante movido para Opcional!" : "Participante inserido no sorteio!";
  
  var card = buildApp(e, {});
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(msg))
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

function actionTestSort(e) {
  Repository.deleteOrder(e.parameters.title, e.parameters.dateKey);
  var card = buildApp(e, {});
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Simulação executada! Menores pontuações subiram."))
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

function actionForceRandomize(e) {
  var card = buildApp(e, { forceRandomize: true });
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

function actionResetScores(e) {
  var card = buildApp(e, { resetScores: true });
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

function actionClearMeetingData(e) {
  Repository.clearMeetingData(e.parameters.title);
  var card = buildApp(e, {});
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Dados desta reunião foram limpos com sucesso!"))
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

function actionFlushAll(e) {
  Repository.flushAll();
  var card = buildApp(e, {});
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Todos os dados de todas as reuniões foram apagados!"))
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}
