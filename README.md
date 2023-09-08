# Bard
Simple yet advanced Discord music bot.<br>
**This software is intended for private use only. We take no responsibility for how it is used and the consequences of doing so. You may not use it for commercial closed-source projects as it is against the GPL v3 license (see: `LICENSE`).**
## Installation
For help with installation, check out [Bard's Wiki](https://github.com/codebois-dev/bard/wiki)!
## The Ways of Customising Bard to Fit Your Needs
### Custom Dashboard Themes
Custom dashboard themes can be configured by editing the utils/themes.json file. Add a new JSON element to the themes list. You need to set it's name and colors. ``mainColor1`` is the first color of the background gradient, followed by ``mainColor2`` being the second color. ``altColor`` is the color of audio player elements e.g. the progress bar or volume bar.
### Custom Languages
Custom languages can be added by duplicating the ``lang/en_GB.json`` file, setting it's name to `ja_JP.json` for example and translating all strings in that file to your language. Then you need to change `LANGUAGE` property in .env file to your file's name without .json extension (e.g. `ja_JP`).

**For more detailed help regarding custom dashboard themes or custom languages, please refer to [Bard's wiki](https://github.com/codebois-dev/bard/wiki).**
## To-Do
- Finish the dashboard with some minor features (e.g. loop button, shuffle mode, autoplay mode, back skip button).
- Websocket implementation (to make web player elements smoother and not lag the server with multiple hour long tracks).
- More Discord commands.
