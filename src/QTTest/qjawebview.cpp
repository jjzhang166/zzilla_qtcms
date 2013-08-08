#include "qjawebview.h"
#include <libpcom.h>
#include <QCoreApplication>
#include <QSettings>
#include <QKeyEvent>
#include <QtXml/QtXml>
#include <IActivities.h>
#include <guid.h>


QJaWebView::QJaWebView(QWidget *parent) :
    QWebView(parent)
{
    setWindowFlags(Qt::FramelessWindowHint);

    // Get Application Path
    QString temp = QCoreApplication::applicationDirPath();
    m_sApplicationPath.append(temp);

	// Connect Signals
    connect(this,SIGNAL(loadFinished(bool)),this,SLOT(OnLoad(bool)));

    // Read Main ini file
    QSettings MainIniFile(m_sApplicationPath + "/MainSet.ini",QSettings::IniFormat);
    QString sTheme = MainIniFile.value(QString("Configure/Theme")).toString();
    QString sThemeDir = MainIniFile.value(sTheme + "/Dir").toString();
    QString sUiDir = m_sApplicationPath + sThemeDir;
    qDebug("%s",sUiDir.toAscii().data());
    load("file:///" + sUiDir);

}


QJaWebView::~QJaWebView()
{
}

void QJaWebView::keyPressEvent(QKeyEvent *ev)
{
    switch(ev->key())
    {
    case Qt::Key_Escape:
        {
            close();
        }
        break;
    }
}

void QJaWebView::OnLoad( bool bOk )
{
    if (bOk)
    {
        QWebFrame * MainFrame;
        MainFrame = page()->mainFrame();

		// Load configure file pcom_config.xml
		QString sAppPath = QCoreApplication::applicationDirPath();
		QFile *file = new QFile(sAppPath + "/pcom_config.xml");

		// use QDomDocument to analyse it
		QDomDocument ConfFile;
		ConfFile.setContent(file);

		// Get CLSID node,all object descripte under this node
		QDomNode clsidNode = ConfFile.elementsByTagName("CLSID").at(0);
		QDomNodeList itemList = clsidNode.childNodes();
		qDebug("item count:%d",itemList.count());
		int n;
		for (n = 0;n < itemList.count();n ++)
		{
			QDomNode item;
			item = itemList.at(n);
			QString sItemName = item.toElement().attribute("name");
			// Get the node named like "activity."
			if (sItemName.left(strlen("activity.")) == QString("activity."))
			{
				// To fix the title
				QString sItemTitle = item.toElement().attribute("title");
				if (sItemTitle == MainFrame->title())
				{
					// find the activity and the make it work
					QString sItemClsid = item.toElement().attribute("clsid");
					GUID guidTemp = pcomString2GUID(sItemClsid);

					IActivities * IActivity = NULL;
					pcomCreateInstance(guidTemp,NULL,IID_IActivities,(void **)&IActivity);
					if (NULL != IActivity)
					{
						IActivity->Active(MainFrame);
					}
				}
			}
		}
		file->close();
    }
}
