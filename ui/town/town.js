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

   StonehearthTownViewProto._du_tracker_old_updateUi = StonehearthTownViewProto._updateUi;
   StonehearthTownViewProto._updateUi = function()
   {
      this._du_tracker_old_updateUi();

      if (!this._dailyReqDiv) {
         $tabPage = this.$(".tabPage");
         if ($tabPage) {
            this._dailyReqDiv = document.createElement("div");
            this._dailyReqDiv.style["font-size"] = "16px";
            $tabPage[0].appendChild(this._dailyReqDiv);
         }
      }

      // Get the current values of player's food and net worth.
      var current = {
         food: this.get('score_data.total_scores.edibles') || 0,
         net_worth: this.get('score_data.total_scores.net_worth') || 0,
      };

      var numCitizens = this.get('num_workers') + this.get('num_crafters') + this.get('num_soldiers');
      var self = this;

      // Calculate and set the daily update requirements.
      $.getJSON('/stonehearth/data/gm/campaigns/game_events/arcs/trigger/game_events/encounters/daily_report_encounter.json', function(data) {
         var data = data.script_info.data;
         var growthReqs = data.growth_requirements;
         var options = {
            numCitizens: numCitizens,
         };

         var foodReq = eval(self._du_tracker_toJSEquation(growthReqs.food, options));
         var foodGoal = current.food >= foodReq
            ? current.food.toString().fontcolor("#6bf10d")
            : current.food.toString().fontcolor("#c21b00");

         var netWorthReq = eval(self._du_tracker_toJSEquation(growthReqs.net_worth, options));
         var netWorthGoal = current.net_worth >= netWorthReq
            ? current.net_worth.toString().fontcolor("#6bf10d")
            : current.net_worth.toString().fontcolor("#c21b00");

         // Show the values in the town window.
         self._dailyReqDiv.innerHTML = String.format("{0}: {1}{2}/{3}, {4}{5}/{6}",
            i18n.t(data.update_title),    // {0}
            i18n.t(data.food_label),      // {1}
            foodGoal,                     // {2}
            foodReq,                      // {3}
            i18n.t(data.net_worth_label), // {4}
            netWorthGoal,                 // {5}
            netWorthReq);                 // {6}
      });
   };

   StonehearthTownViewProto._du_tracker_toJSEquation = function(str, options)
   {
      return str.replace(/num_citizens/g, options.numCitizens)
                .replace(/math/g, 'Math')
                .replace(/([0-9]+)\s*\^\s*([0-9]+)/g, 'Math.pow($1, $2)');
   };

   // Set StonehearthTownView with its new functions.
   App.StonehearthTownView.proto(StonehearthTownViewProto);
});
