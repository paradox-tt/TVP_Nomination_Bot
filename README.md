# 1KV Nomination Tool
<p>
This repository is dedicated to the development of a tool to help nominate validators from the Thousand Validator Programme.  The selection criteria and frequency can be specified via a settings file (Settings.ts).  Should this tool be used by a Parachain, it is envisaged that the parameters can be integrated into its chainstate and loaded (into this application) upon start up.
</p>
<h3>
How does it work?
</h3>
<p>
The system is designed around three (3) sources of validators.
  <ol>
    <li> Partners - These validators are always selected providing that they are nominable*.</li>
    <li> Preferred Validators - This is a list of validators that are chosen manually and specified in Settings.  The system relies on them in the event that there aren't sufficient candidates in the subsequent list (3).</li>
    <li> Thousand Validator Candidates - These validators are automatically retrieved from the thousand validator system.  
      These candidates must:
      <ol>
        <li>Have no faults</li>
        <li>Issued all pending payouts</li>
        <li>Not part of the active set at time of the check</li>
        <li>Commission is within the range as specified in Settings</li>
      </ol>
    </li>
    </oL>

  Validators in referenced lists two (2) and three (3) are all merged together into a single list.  The candidates therein will then be subjected to tests each of which provides a weighted score.  These tests are:
  
  <ul>
  <li>Self Stake - Self stake is a visible and shared risk demonstrated by the validator.  The system prefers validators with higher self-stake and encourages validators to compete to increase their stake. As-to not overly skew comparisons, a setting is provided to help remove outliers.</li>
  <li>Eras validated - Validators should demonstrate some history of validation relative to the period of analysis.  The system prefers validators with more active validation to a limit set in Settings</li>
  <li>
    Commission - Validators should provide commissions within reasonable ranges.  Those who present commissions on towards the lower boundary of the range would receive a higher score.
  </li>
  <li>
    Era Points - Era points are the basis from which rewards are calculated, the system prefers validators with high average scores over an analysis period.  Granted that era_points are generated with a degree of randomness it is anticipated that all validators should have similar scores over time.  Under normal conditions this would not influence comparitive weighting.  However, in the exceptional case that a validator is not configured properly his era points would be below mean and thus lose some of this score.
    </li>
  <li>
    Nominated Stake - The system prefers a validator set with a normalized stake.  This rewards validators who attempt to attain nominations independently but also protects the nominator against nominating validators with too many nominations. 
  </li>
  </ul>
  The boundaries of some tests, and the weights for each test, is configurable in the settings file.
</p>
<p>
With a sorted list of weighted candidates attained, nominable* validators would be selected based on highest score, this resultant list is referred to as the winners.  If any nominable validator exceed the nominated stake threshold or has too many instances already nominated they'll be put into a runner's up list.  These threshold and limits are all configurable in the settings.
</p>
<p>
Lists are now created for Partners, Winners and Runner's up.  The system merges the final list as follows:
  <ol>
    <li> Nominable Partners are placed first</li>
    <li> Winners are placed next up to the maximum number of nominations</li>
    <li> If the above two don't meet the maximum number of nominations, then the remaining are taken from the runner's up list</li>
    </ol>
</p>
<p>
  <i>Nominable - Validators should have the validator intent and not have their nominations blocked.  If nominations are blocked validators the nominate extrinsic will fail</i>
  </p>
  
  <p>Paradox - HqRcfhH8VXMhuCk5JXe28WMgDDuW9MVDVNofe1nnTcefVZn</p>

<p>
With a sorted list of weighted candidates attained, nominable* validators would be selected based on highest score, this resultant list is referred to as the winners.  If any nominable validator exceed the nominated stake threshold or has too many instances already nominated they'll be put into a runner's up list.  These threshold and limits are all configurable in the settings.
</p>
<p>
Lists are now created for Partners, Winners and Runner's up.  The system merges the final list as follows:
  <ol>
    <li> Nominable Partners are placed first</li>
    <li> Winners are placed next up to the maximum number of nominations</li>
    <li> If the above two don't meet the maximum number of nominations, then the remaining are taken from the runner's up list</li>
    </ol>
</p>
<p>
  <i>Nominable - Validators should have the validator intent and not have their nominations blocked.  If nominations are blocked validators the nominate extrinsic will fail</i>
  </p>
  
  <p>Paradox - HqRcfhH8VXMhuCk5JXe28WMgDDuW9MVDVNofe1nnTcefVZn</p>
