---
title: "daisyUIでUI作ってみませんか？"
description: ""
pubDate: "2023-12-08"
---

## 推しのCSSライブラリを紹介させてください！

皆さん、普段CSSライブラリ何を使われてますか？
TailwindCSSのライブラリだけでも魅力的なライブラリがたくさんありますよね！
その中でも[daisyUI](https://daisyui.com/)を推させてください！

## daisyUIはtailwindCSS互換のライブラリ

daisyUIはTailwindCSSのためのライブラリなので自分のプロジェクトにTailwindCSSが導入されていない場合は先にTailwindCSSの導入が必要です

すでに導入済みのプロジェクトではもちろんTailwindCSSのclass名はそのまま使えるため移行に必要なコストは低コストです

npmを使用している場合は以下のコマンドで簡単に導入することができます

```
npm install daisyui
```

公式サイトでコードとプレビューが見れます...!


https://daisyui.com/components/



## 魅力１. 痛いところに手が届くコンポーネントがある

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1471588/defa10f7-2a60-892d-d425-7f0979f7db4c.png)

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1471588/918286fa-51db-330d-8773-965ae67383c7.png)

このようなほかのライブラリでは見ないようなライブラリもあります！
自分が特に助かったのはこのタイムラインです

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1471588/cca7d260-ac6e-99d8-e25a-7dfe898c2bab.png)

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1471588/84a6b874-8658-8087-72e5-d043b979c480.png)

他にもフォームを作るときによく使うけど自分で実装するには少し手間がかかるコンポーネントも充実しています！


## 魅力２．導入のドキュメントが豊富

NuxtやReactではなく記事執筆時点では以下のフレームワークなどへの導入ドキュメントが用意されています！

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1471588/8353ba09-5d87-7e7c-0fb5-5845271e00fa.png)

## 魅力３．テーマが切り替えられる

最近のwebサイトではライトテーマとダークテーマがUI上で切り替えることができますが、このdaisyUIでは複数のテーマの切り替えができるjsが含まれているので
```
<html data-theme="dark">
  <div data-theme="light">
    This div will always use light theme
    <span data-theme="retro">This span will always use retro theme!</span>
  </div>
</html>
```
こんなに手軽にテーマの切り替えUIを作ることができます

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1471588/b37c4a32-b5e1-751e-725e-5ab84ad7de0d.png)

デフォルトでは30種類ほどのテーマが用意されているほか、もちろん自分で定義することも可能です！

ちなみに更新も頻繁に行われているのでGithubも要チェックです！

https://github.com/saadeghi/daisyui/releases


## 終わりに

daisyUIの魅力的な点はほかにもたくさんありますが、その中でも特に自分が推している魅力を３つ記事にさせていただきました
これを機にdaisyUIデビューしてみませんか？？

良きデベロッパーライフを！
