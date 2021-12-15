# 1KV Nomination Tool
<p>
This repository is dedicated to the development of a tool to help nominate validators from the Thousand Validator Programme.  The selection criteria and frequency can be specified via a settings file (Settings.ts).  Should this tool be used by a Parachain, it is envisaged that the parameters can be integrated into it's chain_state and loaded (into this application) upon startup.
</p>
<h3>
How does it work?
</h3>
<p>
The system is designed around three sources of validators.
  <ol>
    <li> Partners - These validators will always be nominated unless they have blocked nominations or they do not have the validator intent</li>
    <li> Preferred Validators - This is a list of validators that are chosen manually and would rely as a fall-back if there are any issues.  It is recommended to keep this list well populated.</li>
    <li> Thousand Validator Canididates - These validators are automatically retrieved from the thousand validator system</li>
    </oL>

  Validators in referenced lists two (2) and three (3) are all merged together into a single list.  The candidates therein will then be subjected to tests each of which provides a weighted score.  These tests are:
  
  <ul>
  <li>Self Stake - Self stake is a visible shared risk demonstrated by the validator.  The system prefers validators with higher self-stake and encourages validators to compete to increase their stake. As-to not overly skew comparisons, a setting is provided to help remove outliers.</li>
  <li>Era's validated - Validators should demonstate some history of validation relative to the period of analysis.  The system prefers validators with more active validation.  The system provides a setting to set the target and the analysis period.</li>
  <li>
    Commission - Validators should provide commissions within reasonable ranges.  Those who present commissions on towards the lower boundary of the range would receive a higher score.
  </li>
  <li>
    Era Points - Era points are the basis from which rewards are calculated, the system prefers validators with high average scores over an analysis period.  Granted that era_points are generated with a degree of randomness it is anticipated that all validators should have similar scores over time.  Under normal condiditions this would not have an effect on weighting however, in the exceptional case that a validator is not configured properly his score will decrease.
    </li>
  <li>
    Nominated Stake - The system prefers a validator set with a normalized stake.  This rewards validators who attempt to attain nominations independently but also protects the nominator against nominating validators with too many nominations. 
  </li>
  </ul>
  
</p>
