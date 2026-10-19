Reef Lagoon is built and working: `index.html` is one 2,329-line file with inline CSS and JS, and Three.js r128 from cdnjs is its only external script. I tested it in headless Chromium in four setups: GPU on WebGL2, a software renderer, WebGL1, and a 360–390 px touch phone view. None of them threw page errors or broke shaders; the only console message was a 404 for the missing favicon.

**What I checked by running it**
- **Start-up:** two dolphins, a turtle, a shark and a manta are swimming, and the humpback breaches 1 s after load. It rises, rolls onto its back and backflops with the big white spray curtain, mist and expanding rings.
- **Throws:** I threw each of the 7 species from its card and took screenshots mid-flight, at entry and after settling. Each lands in its own style (shark knifes in, hammerhead corkscrews, humpback backflops, orca lands on its side, dolphin dives cleanly, turtle belly-plops, manta somersaults into a wing slap), then rights itself under water.
- **Dragging and grabbing:** dragging a card holds the creature over the water with a target ring and drops it on release. Grabbing a turtle out of the water and flinging it also works.
- **Tools:** rain (streaks, ring ripples, dimmer sun) and the whirlpool (funnel with spiral foam arms that carries creatures) both showed up; Clear makes everyone swim off.
- **Limits:** the 24-creature cap shows its toast and greys out the cards.
- **Phone layout:** all 7 cards (with short names) and the 6 tool buttons fit at 360 px wide, with no horizontal scrolling.

Everything else in the brief is implemented as specified. That includes the 90 Hz ripple simulation with absorbing edges, the caustics, the creature shadows on the floor, coral and sand, and all the creatures' swimming behaviour (breathing and spouts, shark fins cutting the surface, leaps and breaches, reactions to taps). It also includes the synthesized sound, the keyboard shortcuts, the adaptive resolution, and the toasts for errors and lost WebGL context.

**Not verified**
- **Sound:** headless Chromium can't play audio, so I couldn't listen to any of it.
- **Behaviour I didn't watch:** I didn't sit through the long-timer behaviours (whale fluke-up dives, shark fin cruising, occasional breaches). I also didn't test the WebGL context-loss toast or a phone without float textures; there the ripples are noticeably degraded and a toast says so.
- **Real devices:** everything was tested in headless Chromium only, not on an actual phone or tablet.

**Changes beyond the brief**
- I added **X** as a keyboard shortcut for Clear, since **C** is taken by Calm.
- On mobile, the cards shrink to fit the screen rather than scrolling.
- If WebGL1 lacks MAX blending, shadows fall back to additive blending.

I deleted my temporary test scripts and screenshots, so only `index.html` is left in the directory.

<!-- cost_usd=7.465061399999999 usage={"input_tokens": 64, "cache_creation_input_tokens": 239433, "cache_read_input_tokens": 6518907, "output_tokens": 212278, "output_tokens_details": {"thinking_tokens": 124929}, "server_tool_use": {"web_search_requests": 0, "web_fetch_requests": 0}, "service_tier": "standard", "cache_creation": {"ephemeral_1h_input_tokens": 239433, "ephemeral_5m_input_tokens": 0}, "inference_geo": "global", "iterations": [{"input_tokens": 2, "output_tokens": 1075, "cache_read_input_tokens": 249868, "cache_creation_input_tokens": 284, "cache_creation": {"ephemeral_5m_input_tokens": 0, "ephemeral_1h_input_tokens": 284}, "type": "message"}], "speed": "standard", "fallback_credit": null} -->
