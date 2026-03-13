var Model = {
  processScores: function(info, guestsObj, state, forceRandomize, resetScores) {
    var activeEmails = guestsObj.allEmails.filter(function(e) { return state.excludeList.indexOf(e) === -1; });
    var excludedEmails = guestsObj.allEmails.filter(function(e) { return state.excludeList.indexOf(e) !== -1; });
    var finalOrder = [];

    if (resetScores) {
      Repository.resetScoresForEmails(info.title, activeEmails);
      Repository.deleteOrder(info.title, info.dateKey);
      state.savedOrderStr = null;
      state.isFirstTime = true;
      forceRandomize = true; 
    }

    if (activeEmails.length > 0) {
      if (state.savedOrderStr && !forceRandomize && !resetScores) {
        // Recupera a lista guardada de hoje
        finalOrder = JSON.parse(state.savedOrderStr);
        finalOrder = finalOrder.filter(function(p) { return activeEmails.indexOf(p.email) !== -1; });
        
        var currentOrderEmails = finalOrder.map(function(p){ return p.email; });
        activeEmails.forEach(function(email) {
          if (currentOrderEmails.indexOf(email) === -1) {
            var currentScore = Repository.getScore(info.title, email);
            finalOrder.push({ email: email, score: currentScore, previousScore: currentScore, added: 0 });
          }
        });

      } else {
        // Gera a nova roleta e processa pontuações
        if (state.isFirstTime || forceRandomize) {
          activeEmails = this.shuffleArray(activeEmails);
          Repository.setInit(info.title);
        } else {
          // Ordena ascendente (menores pontos falam primeiro)
          activeEmails.sort(function(a, b) {
            return Repository.getScore(info.title, a) - Repository.getScore(info.title, b);
          });
        }

        var len = activeEmails.length;
        var newScoresToSave = {};

        activeEmails.forEach(function(email, index) {
          var currentScore = Repository.getScore(info.title, email);
          
          // Entropia: 50% de chance de ganhar 1 ponto extra
          var extraPoint = Math.random() < 0.5 ? 1 : 0;
          var pointsToAdd = len - index + extraPoint;
          var newScore = currentScore + pointsToAdd;

          if (newScore > 100) newScore = 0;

          newScoresToSave["SCORE_" + info.title + "_" + email] = newScore.toString();
          finalOrder.push({ 
            email: email, 
            score: newScore, 
            previousScore: currentScore, 
            added: pointsToAdd 
          });
        });

        // Persiste o resultado gerado
        Repository.saveScoresAndOrder(info.title, info.dateKey, newScoresToSave, finalOrder);
      }
    }

    return {
      finalOrder: finalOrder,
      activeEmails: activeEmails,
      excludedEmails: excludedEmails,
      excludeList: state.excludeList
    };
  },

  shuffleArray: function(array) {
    var currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      var temp = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temp;
    }
    return array;
  }
};
