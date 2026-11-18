name: forge-daily-article
args:
  force:
    default: "0"
steps:
  - id: init
    command: F=""; [ "$LOBSTER_ARG_FORCE" = "1" ] && F="--force"; python3 /home/mjl/forge-automation/repo/automation/bin/forge.py init --engine lobster $F
  - id: pick
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py pick
    env:
      RUN: $init.json.run
  - id: research
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py research
    env:
      RUN: $init.json.run
  - id: outline
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py outline
    env:
      RUN: $init.json.run
  - id: draft
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py draft
    env:
      RUN: $init.json.run
  - id: review1
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py review1
    env:
      RUN: $init.json.run
  - id: revise
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py revise
    env:
      RUN: $init.json.run
  - id: review2
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py review2
    env:
      RUN: $init.json.run
  - id: image
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py image
    env:
      RUN: $init.json.run
  - id: publish
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py publish
    env:
      RUN: $init.json.run
  - id: notify
    command: python3 /home/mjl/forge-automation/repo/automation/bin/forge.py notify
    env:
      RUN: $init.json.run
