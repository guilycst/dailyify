var View = {
  createMainCard: function(info, guestsObj, processed) {
    // 1. Header estilizado como "Branding"
    var card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle("Dailyify")
        .setSubtitle("📅 " + info.title + " • " + Utilities.formatDate(info.event.getStartTime(), Session.getScriptTimeZone(), "dd/MM/yyyy"))
        .setImageUrl("https://www.gstatic.com/images/icons/material/system/1x/loop_black_48dp.png"));

    // ==========================================
    // SECÇÃO 1: ORDEM DE HOJE
    // ==========================================
    var sectionList = CardService.newCardSection().setHeader("🗣️ Ordem de Hoje");
    
    if (processed.finalOrder.length > 0) {
      processed.finalOrder.forEach(function(person, index) {
        var uData = guestsObj.dataMap[person.email] || { name: person.email.split('@')[0], photoUrl: null };
        
        var iconObj = CardService.newIconImage();
        if (uData.photoUrl) {
          iconObj.setIconUrl(uData.photoUrl).setImageCropType(CardService.ImageCropType.CIRCLE);
        } else {
          iconObj.setIcon(CardService.Icon.PERSON);
        }

        // Pontuação formatada para não poluir
        var prev = person.previousScore !== undefined ? person.previousScore : Math.max(0, person.score - (person.added || 0));
        var addedStr = person.added > 0 ? " (+" + person.added + ")" : "";
        var scoreText = "Score: " + prev + addedStr;

        var decoratedText = CardService.newDecoratedText()
          .setTopLabel((index + 1) + "º a falar")
          .setText("<b>" + uData.name + "</b>")
          .setBottomLabel(person.email + " • " + scoreText)
          .setStartIcon(iconObj);
          
        sectionList.addWidget(decoratedText);
      });
    } else {
      sectionList.addWidget(CardService.newTextParagraph().setText("<i>Nenhum participante ativo no sorteio.</i>"));
    }
    card.addSection(sectionList);

    // ==========================================
    // SECÇÃO 2: OPCIONAIS / ASSISTENTES
    // ==========================================
    if (processed.excludedEmails.length > 0) {
      var sectionExcluded = CardService.newCardSection()
        .setHeader("🫥 Opcionais / Assistentes")
        .setCollapsible(true)
        .setNumUncollapsibleWidgets(0);

      processed.excludedEmails.forEach(function(email) {
        var uData = guestsObj.dataMap[email] || { name: email.split('@')[0], photoUrl: null };
        
        var iconObj = CardService.newIconImage();
        if (uData.photoUrl) {
          iconObj.setIconUrl(uData.photoUrl).setImageCropType(CardService.ImageCropType.CIRCLE);
        } else {
          iconObj.setIcon(CardService.Icon.STAR);
        }

        var decoratedExcluded = CardService.newDecoratedText()
          .setText("<i>" + uData.name + "</i>")
          .setBottomLabel(email)
          .setStartIcon(iconObj);
          
        sectionExcluded.addWidget(decoratedExcluded);
      });
      card.addSection(sectionExcluded);
    }

    // ==========================================
    // SECÇÃO 3: PREVISÃO (QUEM ABRE AMANHÃ)
    // ==========================================
    if (processed.finalOrder.length > 0) {
      // Menor pontuação fala primeiro. Model já tratou o reset de 100 -> 0.
      var lowestScore = Math.min.apply(Math, processed.finalOrder.map(function(p) { return p.score; }));
      var nextSpeakers = processed.finalOrder.filter(function(p) { return p.score === lowestScore; });

      // Em caso de empate, mostramos apenas o primeiro da lista
      var speaker = nextSpeakers[0];

      var sectionNext = CardService.newCardSection().setHeader("🔮 Previsão: Abre a Reunião Amanhã");
      
      var uData = guestsObj.dataMap[speaker.email] || { name: speaker.email.split('@')[0], photoUrl: null };
      var iconObj = CardService.newIconImage();
      
      if (uData.photoUrl) {
        iconObj.setIconUrl(uData.photoUrl).setImageCropType(CardService.ImageCropType.CIRCLE);
      } else {
        iconObj.setIcon(CardService.Icon.PERSON);
      }

      var decoratedNext = CardService.newDecoratedText()
        .setTopLabel("Menor pontuação atual")
        .setText("<b>" + uData.name + "</b>")
        .setBottomLabel("Finalizou hoje com Score: " + speaker.score)
        .setStartIcon(iconObj);
        
      sectionNext.addWidget(decoratedNext);
      card.addSection(sectionNext);
    }

    // ==========================================
    // SECÇÃO 4: CONFIGURAÇÕES & AÇÕES (Collapsed)
    // ==========================================
    var sectionConfig = CardService.newCardSection()
      .setHeader("⚙️ Configurações & Ações")
      .setCollapsible(true)
      .setNumUncollapsibleWidgets(0);
    
    var dropdown = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle("Selecionar Membro")
      .setFieldName("selectedEmail");

    guestsObj.allEmails.forEach(function(email) {
      var name = (guestsObj.dataMap[email] && guestsObj.dataMap[email].name) || email.split('@')[0];
      var isExcluded = processed.excludeList.indexOf(email) !== -1;
      dropdown.addItem(name + (isExcluded ? " (Opcional)" : " (Ativo)"), email, false);
    });

    sectionConfig.addWidget(dropdown);
    sectionConfig.addWidget(CardService.newTextButton()
      .setText("Alternar Participação")
      .setOnClickAction(CardService.newAction()
        .setFunctionName("actionToggleGuest")
        .setParameters({title: info.title, dateKey: info.dateKey})));

    // Botões de Ação Padronizados
    sectionConfig.addWidget(CardService.newDivider());
    sectionConfig.addWidget(this.createButton("⏭️ Simular Próximo Dia", "actionTestSort", {title: info.title, dateKey: info.dateKey}));
    sectionConfig.addWidget(this.createButton("🎲 Forçar Randomização", "actionForceRandomize"));
    sectionConfig.addWidget(this.createButton("🔄 Zerar Scores", "actionResetScores"));
    sectionConfig.addWidget(this.createButton("🗑️ Limpar Dados da Reunião", "actionClearMeetingData", {title: info.title}));
    sectionConfig.addWidget(this.createButton("⚠️ Flush Global (Apagar Tudo)", "actionFlushAll"));
    
    card.addSection(sectionConfig);

    // ==========================================
    // SECÇÃO 5: AJUDA & REGRAS (Collapsed)
    // ==========================================
    var sectionAjuda = CardService.newCardSection()
      .setHeader("📖 Ajuda & Regras")
      .setCollapsible(true)
      .setNumUncollapsibleWidgets(0);
      
    var textoRegras = "<b>1. Sorteio:</b> A ordem é baseada no menor Score (quem falou por último fala primeiro).<br><br>" +
                      "<b>2. Pontuação:</b> Falar primeiro rende mais pontos (Total - Posição).<br><br>" +
                      "<b>3. Entropia:</b> Chance de 50% de ganhar +1 ponto extra para evitar empates infinitos.<br><br>" +
                      "<b>4. Limite:</b> Scores acima de 100 voltam para 0.<br><br>" +
                      "<b>5. Individual:</b> O estado é salvo na sua conta Google. Recomenda-se que o condutor da Daily compartilhe a tela.<br><br>" +
                      "<b>• Opcionais:</b> Membros inativos não pontuam e ficam fixos no fim da lista.";
                      
    sectionAjuda.addWidget(CardService.newTextParagraph().setText(textoRegras));
    card.addSection(sectionAjuda);

    return card.build();
  },

  /**
   * Helper para criar botões de texto com ação
   */
  createButton: function(text, functionName, params) {
    var action = CardService.newAction().setFunctionName(functionName);
    if (params) action.setParameters(params);
    return CardService.newTextButton().setText(text).setOnClickAction(action);
  },

  createMessageCard: function(message) {
    return CardService.newCardBuilder()
      .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText(message)))
      .build();
  }
};
