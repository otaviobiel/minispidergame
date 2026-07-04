# Spider Gift

Jogo de navegador feito em HTML, CSS e JavaScript puro, com Canvas, controles mobile e estrutura modular.

## Como rodar

Como usa módulos ES (`type="module"`), rode com servidor local:

```bash
cd spider-gift
python -m http.server 5500
```

Abra:

```txt
http://localhost:5500
```

Ou use a extensão **Live Server** no VS Code.

## Controles

- Celular: botão **TEIA** e botão **ATIRAR**.
- Teclado: `Espaço` para teia e `F` para atirar.

## Estrutura

```txt
spider-gift/
index.html
css/style.css
js/main.js
js/engine/
js/entities/
js/scenes/
js/data/
assets/sprites/
assets/audio/
assets/backgrounds/
```

## Onde trocar por sprites depois

Procure no código por:

- `PLACEHOLDER_PLAYER_SPRITE`
- `PLACEHOLDER_BOSS_SPRITE`
- `PLACEHOLDER_OBSTACLE_SPRITE`
- `PLACEHOLDER_COLLECTIBLE_SPRITE`
- `PLACEHOLDER_BACKGROUND_PARALLAX`
- `PLACEHOLDER_AUDIO`
- `PLACEHOLDER_SPRITE_LOADER`

## Observação

Este é um MVP jogável com formas simples. A prioridade é mecânica, sensação mobile e organização para expansão.
