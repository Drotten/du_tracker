$(top).on('stonehearthReady', function(cc)
{
   // Shamelessly grabbed from http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
   if (!String.format) {
     String.format = function(format) {
       var args = Array.prototype.slice.call(arguments, 1);
       return format.replace(/{(\d+)}/g, function(match, number) { 
         return typeof args[number] != 'undefined'
           ? args[number] 
           : match
         ;
       });
     };
   }

   // Get the StonehearthTownView prototype.
   var StonehearthTownViewProto = App.StonehearthTownView.proto();

   StonehearthTownViewProto.du_tracker_old_updateUi = StonehearthTownViewProto._updateUi;
   StonehearthTownViewProto._updateUi = function() {
      this.du_tracker_old_updateUi();

      if (!this._addedDailyReqDiv)
      {
         this._dailyReqDiv = document.createElement("div");
         this._dailyReqDiv.style["font-size"] = "16px";

         this.$(".tabPage")[0].appendChild(this._dailyReqDiv);

         this._addedDailyReqDiv = true;
      }

      // Get the current values of food, net worth and morale.
      var current = {
         food: this.get('score_data.total_scores.edibles'),
         morale: (Math.floor(this.get('score_data.aggregate.happiness'))/10) || 0,
         net_worth: this.get('score_data.total_scores.net_worth')
      };

      // Don't do anything else if we didn't get any score data (which could happen at the first call of _updateUi).
      if (current.food)
      {
         var numCitizens = this.get('num_workers') + this.get('num_crafters') + this.get('num_soldiers');
         var self = this;

         // Calculate and set the daily update requirements.
         $.getJSON('/stonehearth/data/gm/campaigns/game_events/arcs/trigger/game_events/encounters/daily_report_encounter.json', function(data) {
            var data = data.script_info.data;
            var growthReqs = data.growth_requirements;

            var foodReq = eval(growthReqs.food.replace(/math/g, 'Math').replace(/num_citizens/g, numCitizens));
            var foodGoal = current.food >= foodReq ? current.food.toString().fontcolor("#6bf10d") : current.food.toString().fontcolor("#c21b00");

            var moraleReq = eval(growthReqs.morale.replace(/math/g, 'Math').replace(/num_citizens/g, numCitizens));
            var moraleGoal = current.morale >= moraleReq ? current.morale.toString().fontcolor("#6bf10d") : current.morale.toString().fontcolor("#c21b00");

            var netWorthReq = eval(growthReqs.net_worth.replace(/math/g, 'Math').replace(/num_citizens/g, numCitizens));
            var netWorthGoal = current.net_worth >= netWorthReq ? current.net_worth.toString().fontcolor("#6bf10d") : current.net_worth.toString().fontcolor("#c21b00");

            // Show the values in the town window.
            self._dailyReqDiv.innerHTML = String.format("{0}: {1}{2}/{3}, {4}{5}/{6}, {7}{8}/{9}",
               i18n.t(data.update_title),    // {0}
               i18n.t(data.food_label),      // {1}
               foodGoal,                     // {2}
               foodReq,                      // {3}
               i18n.t(data.morale_label),    // {4}
               moraleGoal,                   // {5}
               moraleReq,                    // {6}
               i18n.t(data.net_worth_label), // {7}
               netWorthGoal,                 // {8}
               netWorthReq);                 // {9}
         });
      }
   };

   // Set StonehearthTownView with its new functions.
   App.StonehearthTownView.proto(StonehearthTownViewProto);
});
