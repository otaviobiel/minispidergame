# MiniSpiderGame
> Documentação Oficial do Projeto

---

# Índice

- Visão Geral
- Conceito
- História
- Gameplay
- Mecânicas
- Progressão
- Controles
- HUD
- Bosses
- Fases
- Sistema de Moedas
- Power-ups
- Spider Sense
- Missões
- Save System
- Assets
- Animações
- Sons
- Estrutura do Projeto
- Arquitetura
- Scripts
- Organização das Pastas
- Roadmap
- Lista de TODO
- Histórico de Alterações

---

# Visão Geral

MiniSpiderGame é um jogo 2D em Pixel Art inspirado em:

- Jetpack Joyride
- Zombie Tsunami
- Homem-Aranha

O foco é criar uma gameplay extremamente fluida com movimentação rápida, sensação de velocidade e combate constante.

---

# Conceito

O jogador controla um pequeno herói com habilidades inspiradas no Homem-Aranha.

Durante o percurso será necessário:

- correr
- desviar
- usar Spider Sense
- derrotar inimigos
- enfrentar chefes
- coletar moedas
- desbloquear melhorias

---

# Gameplay

Loop principal

```
Início

↓

Corre

↓

Desvia

↓

Combate

↓

Coleta moedas

↓

Compra upgrades

↓

Enfrenta Boss

↓

Nova fase
```

---

# Controles

| Ação | PC | Mobile |
|------|-------|----------|
| Pular/Teia | Espaço | Toque |
| Ataque | F | Botão de Ataque |
| Especial | Shift | Botão de Especial |

---

# HUD

A HUD possui:

- Quantidade de Fluído de Teia
- Quantidade de moedas
- Distância em %
- Score
- Temporizador

---

# Sistema do Personagem

## Fluído de teia

Utilizada para:

- Especial
- Ataque

---

# Spider Sense

Quando ativado:

- Tempo desacelera
- Objetos perigosos brilham
- Mísseis ficam destacados
- Ataques especiais aparecem

Cooldown de utilização.

---

# Sistema de Moedas

As moedas servem para:

- comprar skins
- desbloquear fases
- upgrades
- melhorias permanentes

---

# Sistema de Upgrade

Exemplos

- Poderes novos
- Ataques novos
- Estilos de Spider Sense

---

# Inimigos

## Comuns

- Dr. Octopus
- Duende Verde
- Elektro

## Especiais

- Em desenvolvimento

---

# Fases

## Cidade

Skyline noturno

Parallax

Prédios

Luzes

---

## Industrial

Tubulações

Fumaça

Máquinas

---

## Laboratório

Alta tecnologia

Laser

Robôs

---

# Power-ups

- Em desenvolvimento

---

# Sistema de Missões

- Em desenvolvimento

---

# Save System

Salvar:

- moedas
- upgrades
- skins
- fases
- recordes

---

# Estrutura do Projeto

```
MiniSpiderGame/
assets/
sprites/
backgrounds/
boss/
player/
enemies/
sounds/
music/
fonts/
scripts/
ui/
effects/
save/
docs/
```

---

# Organização dos Scripts
Player
Enemy
Boss
HUD
Save
Camera
GameManager
AudioManager
SpiderSense
UpgradeManager
CoinManager
MissionManager

---

# Fluxograma

```
GameManager
↓
Spawn
↓
Player
↓
Enemy
↓
HUD
↓
Boss
↓
Save
```

---

# Roadmap

## Alpha

- Movimento
- Pulo
- Ataque
- HUD

## Beta

- Boss
- Upgrade
- Save

## Release

- Loja
- Skins
- Conquistas
- Ranking

---

# TODO

- [ ] Melhorar IA dos inimigos
- [ ] Adicionar animações
- [ ] Implementar partículas
- [ ] Música dinâmica
- [ ] Sistema de missões
- [ ] Loja
- [ ] Conquistas
- [ ] Ranking
- [ ] Novo Boss

---

# Histórico

## v0.1
- Projeto iniciado

## v0.2
- Sistema de personagem

## v0.3
- Spider Sense

## v0.4
- Boss intermediário

## v0.5
- Sistema de moedas

## v1.0

Release oficial
