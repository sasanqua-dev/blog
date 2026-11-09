---
title: "Reactで初回レンダリング時にさえUseEffectが動いてくれなかった時の話"
description: ""
pubDate: "2023-08-19"
---

こんにちはさざんかです
ReactのUseEffectが思った通りに動いてくれなくてものすごく沼ったので供養します

# 原因のコード
```javascript
// muiとかuseStateとかのいろいろimport

function Info() {
    const [data, setData] = useState([]);
    useEffect(() => {
        fetch(process.env.REACT_APP_BACKEND_ENDPOINT + '/info/')
            .then((response) => response.json())
            .then((data) => {
                setData(data);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    }, []);
    //...
    return (
    // ...
        {data.forecast.today.rain_data?.map((item, index) => (
            <div className="column m-1">
                <p>{item.time}</p>
                <hr />
                <p>{item.persent}</p>
             </div>
         ))}
    // ...
    )

export default Info;
```
まず該当のコードがこちらです
変数「data」を定義してuseEffectでバックエンドのサーバーからデータを取ってきて「setData」でdataに格納して表示する簡単なプログラムです

# 実行してみた
```
Info.js:43 Uncaught TypeError: Cannot read properties of undefined (reading 'forecast')
    at Info (Info.js:43:1)
    at renderWithHooks (react-dom.development.js:16305:1)
    at mountIndeterminateComponent (react-dom.development.js:20074:1)
    at beginWork (react-dom.development.js:21587:1)
    at HTMLUnknownElement.callCallback (react-dom.development.js:4164:1)
    at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:1)
    at invokeGuardedCallback (react-dom.development.js:4277:1)
    at beginWork$1 (react-dom.development.js:27451:1)
    at performUnitOfWork (react-dom.development.js:26557:1)
    at workLoopSync (react-dom.development.js:26466:1)
```
※実際のコードはもうちょっと分量があったので行番号が変わってますが気にしないでください

エラー曰く、「dataがundefinedだからforecastなんていうプロパティーないよー」とのことです。
ここまでの行(データ表示段階まで)でエラーが出ないということはバックエンドサーバーにリスエストを送って問題なく**通信できた**と仮定しました
(サーバーからデータが返ってきたかどうかはわからない)

# はたして本当にサーバーからデータは返ってきたのか

### コードの修正
データのフォーマットかなーとかもしかして文字コードが違うのかなーとか思いながらコードを修正してコンソールに出力を出させるように修正しました

```javascript
// muiとかuseStateとかのいろいろimport

function Info() {
    const [data, setData] = useState([]);
    useEffect(() => {
        fetch(process.env.REACT_APP_BACKEND_ENDPOINT + '/info/')
            .then((response) => response.json())
            .then((data) => {
                // 追加
                console.log(data);
                setData(data);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    }, []);
    //...
    return (
    // ...
        {data.forecast.today.rain_data?.map((item, index) => (
            <div className="column m-1">
                <p>{item.time}</p>
                <hr />
                <p>{item.persent}</p>
             </div>
         ))}
    // ...
    )

export default Info;
```

### 実行

```
Info.js:43 Uncaught TypeError: Cannot read properties of undefined (reading 'forecast')
// 以下略
```
あれ、出力は...?

# コンソールに出力がない！？

コンソール・バックエンドへのアクセスログともにうんともすんとも言ってませんでした
(最初からバックエンドのログも調べるべきだった)

### ChatGPTに聞いてみる
```
問題が解決しない場合、もういくつか試してみることができるアプローチがあります。

1.コンポーネントの単純化: 一時的にコンポーネントを単純化して、他の要因が問題の原因になっていないか確認してみてください。useEffect内での処理を最小限に抑えることで、問題を特定しやすくなるかもしれません。

2.他の環境で試す: 同じコードを異なる環境やプロジェクトで試してみて、問題が特定の環境に関連しているかどうかを確認してみてください。

3.コンソールログの追加: useEffect内や他の関連する部分に、追加のコンソールログを追加してデバッグを試みてみてください。リクエストが送信されているか、レスポンスが正しく処理されているかなどを確認できます。

4.バンドルの再ビルド: プロジェクトのバンドルを再ビルドしてみて、ビルドに関連する問題が原因である可能性を排除できるか試してみてください。
```
1 →　すでにかなり単純化してる
2 →　後で試してみる
3 →　出力されなかった
4 →　開発環境だから関係ないはず

### 別のコンポーネントに混ぜて確認してみる

ChatGPT先生の教え通り問題なくuseEffectが動いてる別のコンポーネントにコードを移植して動作するかどうかを試してみました

```javascript
function Main() {
    const [todaydata, gettodaydata] = useState([]);
    useEffect(() => {
        axios.get(process.env.REACT_APP_BACKEND_ENDPOINT + '/today/').then((res) => {
            gettodaydata(res.data);
        });
    }, []);
    
    //動かいないコードを追加
    const [data, setData] = useState([]);
    useEffect(() => {
        fetch(process.env.REACT_APP_BACKEND_ENDPOINT + '/info/')
            .then((response) => response.json())
            .then((data) => {
                // 追加
                console.log(data);
                setData(data);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    }, []);
    // 
    return (
        //略
    )
}

export default Main;

```

### 実行してみる

```
----
{data...}
----
```
動いた！？

# ほかのコンポーネントだと問題なく動作する！？

### ChatGPTの考察

動いたことに感動しましたが元のコンポーネントで動かなければ意味がありません
そこでもう一度chatGPT先生に聞いてみます

```
他のファイルに追加して実行すると問題なく動作することから、コード自体には問題がないようですね。その場合、問題は元のコンポーネントやプロジェクトの設定に関連している可能性が高いです。

// 要約
以下のアプローチを試してみて、問題の原因をさらに絞り込んでみてください。

１．コンポーネントの配置
２．他のコードの影響: setDataを他の場所で上書きしていないか確認してみてください。
３．Reactのバージョン
４．React DevToolsを使用して、コンポーネントの状態やプロパティの変化、再レンダリングの動作を確認してみてください。
５．設定が適切に行われていることを再度確認してみてください。
６．キャッシュをクリアしてから再度試してみてください。
７．別のブラウザを使用しても同じ問題が発生するかどうかを確認してみてください。
８．バンドルの再ビルド

```
もちろんすべて問題ありませんでした
ここでChatGPT先生とはしばしお別れして人力で調べてみます

### 各種情報サイトで検索

UseEffectを初回で発火させない方法やUseEffectを初回のみ発火させる方法はありましたが、解決につながる情報を見つけることはできませんでした

あきらめたくなりました

# ひらめく

### １つの仮設

すでにかなり疲れていたので一晩おいて考えてみることにしました
そこで１つの仮設にたどり着きました

**「サーバーとの通信が終わる前にレンダリングされてるのでは」**

他のコンポーネントで問題なく動いていたので非同期通信だからこそ先にレンダリングされて参照できなくなってるのではと思いましたが、だったら通信が終わってデータがとれた時点で再レンダリングされて表示されるはずだし...とReactのUseState周りの仕様を理解できていないがゆえに半信半疑でした。
しかし、他に打つ手がないので実行してみることに

```
function Info() {
    const [data, setData] = useState([]);
    useEffect(() => {
        fetch(process.env.REACT_APP_BACKEND_ENDPOINT + '/info/')
            .then((response) => response.json())
            .then((data) => {
                // 追加
                console.log(data);
                setData(data);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    }, []);
    //...
    return (
    // ...
        {!isEmpty(infodata) ? (
            {data.forecast.today.rain_data?.map((item, index) => (
                <div className="column m-1">
                    <p>{item.time}</p>
                    <hr />
                    <p>{item.persent}</p>
                 </div>
             ))}
         ):(
            // 読み込み待ちの状態だと「Loading」が表示される
            <div>
              <b>Now Loading...</b>
            </div>
         )
    )

export default Info;
```

### 無事動いてくれる

結果、今までのエラーが跡形もなく消え問題なく動いてくれました

# おまけに

この記事でも使っていますがChatGPTに手伝ってももらうのを自分はお勧めしてます！
もちろん、個人の主観ですが。
何よりも、エラーの対処法や(あってるとは限らない)生成してくれるコードがきれいかつコメントがついているので使い慣れてない言語の開発するときには力強い味方になってくれますよ！

さらに、今回の記事もChatGPTのログを見ながら書いていますが自分がどこで躓いたのか、何が原因だったのかがログとして会話形式で残ってくれるのもあとから修正したりアウトプットするときに便利です✨

# 感想

まず、この記事とは別で詰まったことが１つ
**Reactの環境変数はREACT_APP_から始める**
これを知らなくて小一時間沼りました

そして、今回のことで分かったことは
**非同期通信を使うときが通信が終わるまでの間の挙動も考える**
**そしてちゃんと仕様を理解する**
事ですね...

Reactと仲良くやっていけるようにもう少し勉強したいと思いました
最後まで読んでいただきありがとうございました！
少しでも参考になればうれしいです！


