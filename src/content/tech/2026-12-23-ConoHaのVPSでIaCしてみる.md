---
title: 'VPSにこそ必要なIaC'
description: 'これまでGithub ActionsでSSH接続してデプロイしていたサーバーにIaCを導入してみました'
pubDate: '2026-12-23'
---

この記事は[ConoHa Advent Calendar 2026](https://qiita.com/advent-calendar/2026/conoha) 23日目の記事です！
今年もクリスマスの時期がやってきましたね。クリスマスといえばアドベントカレンダー、アドベントカレンダーといえばConoHaの生活もなんともう３年目になりました。

ref:
2024年アドベントカレンダー記事：[Conoha × Cloudflareでお手軽デプロイ](https://note.sasanqua.dev/article/tech/2024-12-24-conoha-cloudflare%E3%81%A7%E3%81%8A%E6%89%8B%E8%BB%BD%E3%83%87%E3%83%97%E3%83%AD%E3%82%A4/)
2025年アドベントカレンダー記事：[組織の中でアプリを作るための技術選定](https://note.sasanqua.dev/article/tech/2025-12-25-%E7%B5%84%E7%B9%94%E3%81%AE%E4%B8%AD%E3%81%A7%E3%82%A2%E3%83%97%E3%83%AA%E3%82%92%E4%BD%9C%E3%82%8B%E3%81%9F%E3%82%81%E3%81%AE%E6%8A%80%E8%A1%93%E9%81%B8%E5%AE%9A/)

2年連続Zennで書いてきましたが、なんと今年から個人ブログになりました。いぇい。

## はじめに

**冪等性好きですかー？？**

個人的2026年流行語対象は冪等性だと言っても過言じゃないほど今年は冪等性を意識したとしてでした。  
冪等性とは

> 情報工学における冪等とは、ある操作を1度行っても複数回行っても同じ効果となることを言う。特に、何回行ってもエラーや不整合の状態が変わらない操作を指す。
> https://ja.wikipedia.org/wiki/%E5%86%AA%E7%AD%89#%E6%83%85%E5%A0%B1%E5%B7%A5%E5%AD%A6%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E5%86%AA%E7%AD%89

らしいです。
よくIaCなどの文脈で使われる言葉ですね。

ということで今回はIaC文脈のおはなしになります。

## VPSにIaCは必要なのか

さて、IaCといえば「AWSにデプロイするんだ」とか「k8s動かしてるんだ」みたいな人が使っているイメージが強いんじゃないでしょうか。  
自分もそう思います。  
ただ、このIaCの考えは秘伝のタレ化しやすいVPSでこそ真価を発揮すると思っています。

### VPSって便利だよね

例えば、VPSはCloud Runなどと異なり、１つのインスタンスが持つ責務が大きくなりがちです。（そりゃスペック高いですもんね）
その時に、このVPSにはどのライブラリが入っていてどこまでバージョン管理されていて、などがなかなかメンテナンスできなくなりがちです。  
場当たり的にライブラリ入れたりとかトラシューのためにライブラリ入れたりとか。
VPSってなんでもできるしある程度のスペックがあるから便利ですよね。

### お引越しできますか？

さて、ある時、何らかの要因でVPSをお引越しすることになりました。  
原因はたくさん考えられるでしょう。  
「検証で戯れてたら壊した」とか
「スペックが足りなくなって上げたい」とか
「リージョンを移したい」とか
そんな時にIaCで管理されていない場合はVPSの中に入っているライブラリをすべてリストアップして入れ直すことになります。
逆にいえば、こんな時にIaC化されていれば宛先を変えるだけで元の環境が復元できるわけですね。

### VPSにこそIaCが必要

というわけで、VPSにこそIaCが必要なのです。
注：今回の記事ではAnsibleのみを対象としてます、抽象度を上げるとインスタンスそのものではなくインスタンス内部のIaC化の話になります。

## Ansibleの導入

### Ansibleって何者？

今回はたまによく聞くでお馴染みのAnsibleをConoHaのVPSに導入しようと思います。

> Ansible（アンシブル）は、サーバーやネットワーク機器、クラウド環境などの設定やアプリ配置を自動化するための構成管理・自動化ツールです。
> 最大の特徴は、管理対象サーバー側に専用ソフト（エージェント）を入れる必要がないエージェントレスである点と、YAML形式の読みやすい記述（Playbook）で設定を書ける点です。

らしいです。（by Gemini）

（インフラ領域の方々から怒られそうですが）個人的には魔法の.shファイル的なものだと思ってます。

### 今回の構成とGoal

今回の構成はConoHaのVPS 1台の超シンプル構成です。  
Goalとしてはこんな感じ

- Dockerが動かせるようになる
- 自作アプリのイメージをGHCRから落としてくる
- OSSをいくつか落としてくる
- サーバーのSSH認証を整える

こんなところでしょうか。
最後についてですが、今回の対象サーバーはopksshを使って開発チームのOIDCでのSSH認証を行っているためその設定を流し込むためのものになります。

### 必要なもの

実はAnsibleは特にエージェントなどもないので事前準備（特にサーバー側）はほとんど必要ありません。  
Ansibleがログインできるユーザーとsshで使う秘密鍵と各種環境変数あるいはシークレットを用意しておきましょう。

## IaC化してみる

### ディレクトリ構成

今回はこんな感じのシンプルな構成にしました。

```
ansible/
├── inventory.yml        # 接続先ホストの定義
├── playbook.yml         # メインのPlaybook
├── group_vars/
│   └── all.yml          # 共通変数
└── roles/
    ├── docker/          # Docker関連のロール
    ├── apps/            # アプリケーション起動のロール
    └── ssh/             # SSH認証設定のロール
```

ロールごとに責務を分けておくと、後から「Dockerの設定だけ変えたい」みたいな時に便利です。

### インベントリファイル

まずはどのサーバーに対して実行するかを定義します。

```yaml
# inventory.yml
all:
    hosts:
        conoha-vps:
            ansible_host: xxx.xxx.xxx.xxx # VPSのIPアドレス
            ansible_user: ubuntu
            ansible_ssh_private_key_file: ~/.ssh/id_ed25519
```

### Dockerのセットアップ

```yaml
# roles/docker/tasks/main.yml
- name: Install required packages
  apt:
      name:
          - ca-certificates
          - curl
          - gnupg
      state: present
      update_cache: yes

- name: Add Docker GPG key
  shell: |
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      chmod a+r /etc/apt/keyrings/docker.gpg
  args:
      creates: /etc/apt/keyrings/docker.gpg

- name: Add Docker repository
  shell: |
      echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
  args:
      creates: /etc/apt/sources.list.d/docker.list

- name: Install Docker
  apt:
      name:
          - docker-ce
          - docker-ce-cli
          - containerd.io
          - docker-buildx-plugin
          - docker-compose-plugin
      state: present
      update_cache: yes

- name: Enable and start Docker service
  systemd:
      name: docker
      enabled: yes
      state: started

- name: Add user to docker group
  user:
      name: '{{ ansible_user }}'
      groups: docker
      append: yes
```

`creates` を使って冪等性を担保しているのがポイントです。  
「すでにGPGキーが存在すればスキップ」という挙動になります。
なんだかんだこのGPGキー周りの設定ってめんどくさいのでここ自動化してくれるのは結構嬉しいですよね。

### GHCRからイメージを取得してアプリを起動する

自作アプリのコンテナイメージはGitHub Container Registry（GHCR）に置いいてあるものとします。（大体そうでしょう、自分はそうです）  
Ansibleからdocker composeを呼び出す形にしました。

```yaml
# roles/apps/tasks/main.yml
- name: Create app directory
  file:
      path: /opt/myapp
      state: directory
      owner: '{{ ansible_user }}'
      mode: '0755'

- name: Copy docker-compose.yml
  template:
      src: docker-compose.yml.j2
      dest: /opt/myapp/docker-compose.yml
      owner: '{{ ansible_user }}'
      mode: '0644'

- name: Log in to GHCR
  community.docker.docker_login:
      registry: ghcr.io
      username: '{{ ghcr_username }}'
      password: '{{ ghcr_token }}'

- name: Pull and start containers
  community.docker.docker_compose_v2:
      project_src: /opt/myapp
      pull: always
      state: present
```

GHCRのトークンは `group_vars/all.yml` にそのまま書くわけにはいかないので、`ansible-vault` で暗号化して管理しています。

```bash
# シークレットを暗号化
ansible-vault encrypt_string 'ghp_xxxxxxxxxxxx' --name 'ghcr_token'
```

これで `group_vars/all.yml` にはこんな感じで書けます。

```yaml
ghcr_token: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    ...（暗号化された文字列）...
```

### opksshのセットアップ

今回の構成では [opkssh](https://github.com/openpubkey/opkssh) を使って、OIDCによるSSH認証を実現しています。  
具体的には自前のOIDCプロバイダーである [Pocket ID](https://github.com/stonith404/pocket-id) の `developer` グループに所属しているユーザーのみSSHできるようにしています。

```yaml
# roles/ssh/tasks/main.yml
- name: Download opkssh binary
  get_url:
      url: 'https://github.com/openpubkey/opkssh/releases/latest/download/opkssh-linux-amd64'
      dest: /usr/local/bin/opkssh
      mode: '0755'

- name: Configure sshd for opkssh
  lineinfile:
      path: /etc/ssh/sshd_config
      regexp: '^#?{{ item.key }}'
      line: '{{ item.key }} {{ item.value }}'
      state: present
  loop:
      - { key: 'AuthorizedKeysCommand', value: '/usr/local/bin/opkssh verify %u %k %t' }
      - { key: 'AuthorizedKeysCommandUser', value: 'nobody' }
  notify: Restart sshd

- name: Configure allowed users
  copy:
      content: |
          {{ ansible_user }} group:developer {{ pocket_id_issuer }}
      dest: /etc/opkssh/policy
      owner: root
      mode: '0644'
```

```yaml
# roles/ssh/handlers/main.yml
- name: Restart sshd
  systemd:
      name: sshd
      state: restarted
```

ハンドラーを使っているので、設定変更があった時だけsshdが再起動されます。これも冪等性の一部ですね。

### Playbookを実行する

全部まとめたPlaybookはこんな感じです。

```yaml
# playbook.yml
- hosts: all
  become: yes
  roles:
      - docker
      - apps
      - ssh
```

実行はこれだけ。

```bash
ansible-playbook -i inventory.yml playbook.yml --ask-vault-pass
```

初回セットアップが10分かからず終わります。

## やってみての感想

### 良かったこと

CI/CDですべてが完結するのがいいですね。
あとは、リポジトリ側にインフラの情報を持たせられるのでClaudeなりGPTがコードを書く時にいい感じに何とかしてくれます。
（デプロイこけてもそれを検知して修正してくれるし）

### ちょっと大変だったこと

普通にAnsibleの書き方に慣れるのが大変ですよね。
ただ結局yamlなので慣れちゃえばスラスラかけるとは思います。

## まとめ

ということでConoHaのVPSにIaCを導入してみる話でした。
それでは良いクリスマスを🎄

余談ですが、流石に本番が動いてるConoHaのVPS上で確認はできないのでオンプレにUbuntu 1台建ててめっちゃ検証しながら進めてました。  
やる時は既存のリソースが間違えて消えないように（定義漏れとか、上書きとか）差分検知とかPoC環境での実験とかはちゃんとすることをお勧めします。

自宅のオンプレでこのPoCのUbuntuを払い出すためにterraform触らないといけなかったのが一番めんどくさかったけどそれはまた別のお話...
